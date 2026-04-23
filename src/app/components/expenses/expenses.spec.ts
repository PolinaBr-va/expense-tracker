import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';

import { ExpensesComponent } from './expenses';
import { BehaviorSubject, firstValueFrom, of } from 'rxjs';
import { FormBuilder } from '@angular/forms';
import { ExpensesService } from '../../services/expenses-service';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Transaction, TransactionType } from '../../models/transaction';
import { Category } from '../../models/category';

describe('Expenses', () => {
  let component: ExpensesComponent;
  let fixture: ComponentFixture<ExpensesComponent>;
  let expensesServiceMock: any;
  let transactionsSubject: BehaviorSubject<Transaction[]>;
  let categoriesSubject: BehaviorSubject<Category[]>;

  beforeEach(async () => {
    transactionsSubject = new BehaviorSubject<Transaction[]>([]);
    categoriesSubject = new BehaviorSubject<Category[]>([]);

    expensesServiceMock = {
      categories$: categoriesSubject.asObservable(),
      transactions$: transactionsSubject.asObservable(),
      addCategory: jasmine.createSpy().and.returnValue(of(null)),
      deleteCategory: jasmine.createSpy().and.returnValue(of(null)),
      addTransaction: jasmine.createSpy().and.returnValue(of(null)),
      deleteTransaction: jasmine.createSpy().and.returnValue(of(null)),
    };

    await TestBed.configureTestingModule({
      imports: [ExpensesComponent],
      providers: [FormBuilder, { provide: ExpensesService, useValue: expensesServiceMock }],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ExpensesComponent);
    component = fixture.componentInstance;
  });

  beforeEach(() => {
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should init form with null category', () => {
    expect(component.componentForm.value.category).toBeNull();
  });

  describe('calculation logic', () => {
    it('should calculate total income', async () => {
      transactionsSubject.next([
        { amount: 100, type: TransactionType.Income } as Transaction,
        { amount: 50, type: TransactionType.Expense } as Transaction,
      ]);

      const val = await firstValueFrom(component.totalIncome$);

      expect(val).toBe(100);
    });

    it('should calculate total expense', async () => {
      transactionsSubject.next([
        { amount: 100, type: TransactionType.Income } as Transaction,
        { amount: 50, type: TransactionType.Expense } as Transaction,
      ]);

      const val = await firstValueFrom(component.totalExpense$);

      expect(val).toBe(50);
    });

    it('should calculate balance', async () => {
      transactionsSubject.next([
        { amount: 100, type: TransactionType.Income } as Transaction,
        { amount: 40, type: TransactionType.Expense } as Transaction,
      ]);

      const val = await firstValueFrom(component.balance$);

      expect(val).toBe(60);
    });
  });

  describe('filtered transactions', () => {
    it('should return all transactions when no category selected', async () => {
      const transactions = [{ categoryId: 1 } as Transaction, { categoryId: 2 } as Transaction];

      transactionsSubject.next(transactions);

      const res = await firstValueFrom(component.filteredTransactions$);

      expect(res.length).toBe(2);
    });

    it('should filter transactions by category', async () => {
      const transactions = [{ categoryId: 1 } as Transaction, { categoryId: 2 } as Transaction];

      transactionsSubject.next(transactions);

      component.componentForm.get('category')?.setValue({ id: 1 });

      const res = await firstValueFrom(component.filteredTransactions$);

      expect(res.length).toBe(1);
      expect(res[0].categoryId).toBe(1);
    });
  });

  describe('validation', () => {
    it('should validate income whithout category', () => {
      component.newTransaction = {
        description: 'test',
        amount: 100,
        type: TransactionType.Income,
        date: new Date(),
      } as any;

      expect(component.isTransactionValid()).toBeTrue();
    });

    it('should require category for expense', () => {
      component.newTransaction = {
        description: 'test',
        amount: 100,
        type: TransactionType.Expense,
        date: new Date(),
      } as any;

      component.selectedCategory = null;

      expect(component.isTransactionValid()).toBeFalse();
    });
  });

  describe('categories', () => {
    it('should not add category if name is empty', () => {
      component.newCategory = { name: ' ' };

      component.addCategory();

      expect(expensesServiceMock.addCategory).not.toHaveBeenCalled();
    });

    it('should add category and close dialog', () => {
      component.newCategory = { name: 'Food' };
      component.showAddCategoryDialog = true;

      component.addCategory();

      expect(expensesServiceMock.addCategory).toHaveBeenCalled();
      expect(component.showAddCategoryDialog).toBeFalse();
    });

    it('should not delete category if it has transactions', fakeAsync(() => {
      spyOn(window, 'alert');

      transactionsSubject.next([{ categoryId: 1 } as Transaction]);

      component.deleteCategory({ id: 1 } as Category);
      tick();
      expect(window.alert).toHaveBeenCalledWith(
        'Ошибка! Нельзя удалить категорию, есть связанные расходы',
      );
      expect(expensesServiceMock.deleteCategory).not.toHaveBeenCalled();
    }));

    it('should delete category if no transactions', fakeAsync(() => {
      transactionsSubject.next([]);

      component.deleteCategory({ id: 1 } as Category);
      tick();
      expect(expensesServiceMock.deleteCategory).toHaveBeenCalledWith(1);
    }));
  });

  describe('transactions', () => {
    it('should not add transaction if invalid', () => {
      component.newTransaction = {
        description: '',
        amount: 0,
        type: TransactionType.Expense,
        date: null,
      } as any;

      component.addTransaction();

      expect(expensesServiceMock.addTransaction).not.toHaveBeenCalled();
    });

    it('should add transaction when valid', () => {
      component.newTransaction = {
        description: 'test',
        amount: 100,
        type: TransactionType.Income,
        date: new Date(),
      } as any;

      component.addTransaction();

      expect(expensesServiceMock.addTransaction).toHaveBeenCalled();
    });

    it('should delete transaction', () => {
      component.deleteTransaction({ id: 1 } as Transaction);

      expect(expensesServiceMock.deleteTransaction).toHaveBeenCalledWith(1);
    });
  });

  it('should open transaction dialog', () => {
    component.openTransactionDialog(TransactionType.Income);

    expect(component.showAddTransactionDialog).toBeTrue();
    expect(component.newTransaction.type).toBe(TransactionType.Income);
  });
});
