import { fakeAsync, TestBed, tick } from '@angular/core/testing';

import { ExpensesService } from './expenses-service';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { Transaction, TransactionType } from '../models/transaction';
import { Category } from '../models/category';
import { take } from 'rxjs';

describe('ExpensesService', () => {
  let service: ExpensesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ExpensesService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ExpensesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  function flushInitialRequests() {
    const categoriesReq = httpMock.expectOne('http://localhost:3000/categories');
    categoriesReq.flush([]);
    const transactionsReq = httpMock.expectOne('http://localhost:3000/transactions');
    transactionsReq.flush([]);
  }

  const fixedDate = new Date('2024-01-01');

  it('should load categories on init', fakeAsync(() => {
    const mockCategories: Category[] = [{ id: 1, name: 'Test' }];

    let categoriesResult: Category[] | undefined;
    service.categories$.pipe(take(2)).subscribe(cats => categoriesResult = cats);

    const categoriesReq = httpMock.expectOne('http://localhost:3000/categories');
    const transactionsReq = httpMock.expectOne('http://localhost:3000/transactions');

    expect(categoriesReq.request.method).toBe('GET');
    expect(transactionsReq.request.method).toBe('GET');

    categoriesReq.flush(mockCategories);
    transactionsReq.flush([]);

    tick();

    expect(categoriesResult).toEqual(mockCategories);
  }));

  it('should handle error when loading categories', () => {
    const consoleSpy = spyOn(console, 'error');

    service.categories$.subscribe();

    const categoriesReq = httpMock.expectOne('http://localhost:3000/categories');
    const transactionsReq = httpMock.expectOne('http://localhost:3000/transactions');

    categoriesReq.flush('Error', { status: 500, statusText: 'ServerError' });
    transactionsReq.flush([]);

    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should load transactions on init', fakeAsync(() => {
    const mockTransactions: Transaction[] = [
      { id: 1, description: 'test', amount: 1000, type: TransactionType.Expense, date: fixedDate },
    ];

    let transactionsResult: Transaction[] | undefined;

    service.transactions$.pipe(take(2)).subscribe(trans => transactionsResult = trans);

    const categoriesReq = httpMock.expectOne('http://localhost:3000/categories');
    const transactionsReq = httpMock.expectOne('http://localhost:3000/transactions');

    expect(categoriesReq.request.method).toBe('GET');
    expect(transactionsReq.request.method).toBe('GET');

    categoriesReq.flush([]);
    transactionsReq.flush(mockTransactions);
    
    tick();

    expect(transactionsResult).toEqual(mockTransactions);
  }));

  it('should handle error when loading transactions', () => {
    const consoleSpy = spyOn(console, 'error');

    service.transactions$.subscribe();

    const categoriesReq = httpMock.expectOne('http://localhost:3000/categories');
    const transactionsReq = httpMock.expectOne('http://localhost:3000/transactions');

    transactionsReq.flush('Error', { status: 500, statusText: 'ServerError' });
    categoriesReq.flush([]);

    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should add category via POST and update BehaviorSubject', fakeAsync(() => {
    flushInitialRequests();
    const newCategory: Category = { id: 123, name: 'New Cat' };

    let updatedCategories: Category[] = [];
    service.categories$.subscribe((cats) => (updatedCategories = cats));

    let response: Category | undefined;
    service.addCategory(newCategory).subscribe((res) => (response = res));

    const req = httpMock.expectOne('http://localhost:3000/categories');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newCategory);
    req.flush(newCategory);
    tick();

    expect(response).toBeDefined();
    expect(response).toEqual(newCategory);
    expect(updatedCategories).toContain(newCategory);
  }));

  it('should delete category via DELETE and update BehaviorSubject', fakeAsync(() => {
    flushInitialRequests();
    const existingCategories: Category[] = [
      { id: 1, name: 'Еда' },
      { id: 2, name: 'Транспорт' },
    ];

    (service as any).categoriesSubject.next(existingCategories);

    let updatedCategories: Category[] = [];
    service.categories$.subscribe((cats) => (updatedCategories = cats));

    service.deleteCategory(1).subscribe();

    const req = httpMock.expectOne('http://localhost:3000/categories/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
    tick();

    expect(updatedCategories).toEqual([{ id: 2, name: 'Транспорт' }]);
  }));

  it('should add transaction via POST and update BehaviorSubject', fakeAsync(() => {
    flushInitialRequests();
    const newTransaction: Transaction = {
      id: 0,
      description: 'кофе',
      amount: 250,
      type: TransactionType.Expense,
      category: 'Кафе',
      categoryId: 20,
      date: fixedDate,
    };

    const savedTransaction = { ...newTransaction, id: 999 };

    let updatedTransactions: Transaction[] = [];
    service.transactions$.subscribe((trans) => (updatedTransactions = trans));

    let response: Transaction | undefined;
    service.addTransaction(newTransaction).subscribe((res) => (response = res));

    const req = httpMock.expectOne('http://localhost:3000/transactions');
    expect(req.request.method).toBe('POST');
    req.flush(savedTransaction);
    tick();

    expect(response).toEqual(savedTransaction);
    expect(updatedTransactions).toContain(savedTransaction);
  }));

  it('should delete transaction via DELETE and update BehaviorSubject', fakeAsync(() => {
    flushInitialRequests();
    const existingTransactions: Transaction[] = [
      {
        id: 100,
        description: 'бургер',
        amount: 250,
        type: TransactionType.Expense,
        category: 'Кафе',
        categoryId: 50,
        date: fixedDate,
      },
      {
        id: 101,
        description: 'тренировка',
        amount: 250,
        type: TransactionType.Expense,
        category: 'Спорт',
        categoryId: 60,
        date: fixedDate,
      },
    ];

    (service as any).transactionsSubject.next(existingTransactions);

    let updatedTransactions: Transaction[] = [];
    service.transactions$.subscribe((trans) => (updatedTransactions = trans));

    service.deleteTransaction(100).subscribe();

    const req = httpMock.expectOne('http://localhost:3000/transactions/100');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
    tick();

    expect(updatedTransactions).toEqual([
      {
        id: 101,
        description: 'тренировка',
        amount: 250,
        type: TransactionType.Expense,
        category: 'Спорт',
        categoryId: 60,
        date: fixedDate,
      },
    ]);
  }));
});
