import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { ExpensesService } from '../../services/expenses-service';
import { Category } from '../../models/category';
import { Transaction, TransactionType } from '../../models/transaction';
import { DatePipe, CurrencyPipe, DecimalPipe, AsyncPipe, NgClass } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CascadeSelectModule } from 'primeng/cascadeselect';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumber } from 'primeng/inputnumber';
import { TableModule } from 'primeng/table';
import { DatePickerModule } from 'primeng/datepicker';
import { TooltipModule } from 'primeng/tooltip';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { combineLatest, map, Observable, shareReplay, startWith, take } from 'rxjs';

type CategoryFilter = Category | { id: null; name: string; icon?: string };

@Component({
  selector: 'app-expenses',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    DatePipe,
    CurrencyPipe,
    DecimalPipe,
    AsyncPipe,
    NgClass,
    CascadeSelectModule,
    ButtonModule,
    SelectModule,
    DialogModule,
    InputTextModule,
    InputNumber,
    TableModule,
    DatePickerModule,
    TooltipModule,
  ],
  templateUrl: './expenses.html',
  styleUrl: './expenses.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpensesComponent implements OnInit {
  private expensesService = inject(ExpensesService);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  readonly TransactionType = TransactionType;

  componentForm!: FormGroup;

  categories$ = this.expensesService.categories$;
  transactions$ = this.expensesService.transactions$;

  selectedCategory$!: Observable<Category | null>;
  filteredTransactions$!: Observable<Transaction[]>;

  totalIncome$ = this.transactions$.pipe(
    map((ts) =>
      ts.filter((t) => t.type === TransactionType.Income).reduce((sum, t) => sum + t.amount, 0),
    ),
  );

  totalExpense$ = this.transactions$.pipe(
    map((ts) =>
      ts.filter((t) => t.type === TransactionType.Expense).reduce((sum, t) => sum + t.amount, 0),
    ),
  );

  balance$ = combineLatest([this.totalIncome$, this.totalExpense$]).pipe(
    map(([inc, exp]) => inc - exp),
  );

  filterCategories$: Observable<CategoryFilter[]> = this.categories$.pipe(
    map((cats) => [{ id: null, name: 'Все категории' }, ...cats]),
  );

  stats$ = combineLatest([this.totalIncome$, this.totalExpense$, this.balance$]).pipe(
    map(([income, expense, balance]) => ({ income, expense, balance })),
  );

  showAddCategoryDialog = false;
  showAddTransactionDialog = false;
  newCategory: Partial<Category> = { name: '', icon: '' };
  newTransaction: Required<Transaction> = {
    id: 0,
    description: '',
    amount: 0,
    type: TransactionType.Expense,
    category: '',
    categoryId: 0,
    date: new Date(),
  };
  transactionTypes = [
    { label: 'Доходы', value: TransactionType.Income },
    { label: 'Расходы', value: TransactionType.Expense },
  ];
  selectedCategory: Category | null = null;

  ngOnInit(): void {
    this.initComponentForm();

    const categoryControl = this.componentForm.get('category');
    this.selectedCategory$ = categoryControl!.valueChanges.pipe(startWith(null));

    this.filteredTransactions$ = combineLatest([this.transactions$, this.selectedCategory$]).pipe(
      map(([transactions, category]) =>
        category?.id ? transactions.filter((t) => t.categoryId === category.id) : transactions,
      ),
      shareReplay(1),
    );
  }

  addCategory(): void {
    if (!this.newCategory.name?.trim()) return;

    const categoryToAdd: Category = {
      id: Date.now(),
      name: this.newCategory.name.trim(),
      icon: '📁',
    };

    this.expensesService
      .addCategory(categoryToAdd)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.closeDialogCat(),
        error: (err) => {
          console.error('Ошибка при добавлении категории', err);
        },
      });
  }

  deleteCategory(category: Category): void {
    if (!category?.id) return;

    this.transactions$
      .pipe(
        take(1),
        map((transactions) => transactions.some((t) => t.categoryId === category.id)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((hasTransactions) => {
        if (hasTransactions) {
          alert('Ошибка! Нельзя удалить категорию, есть связанные расходы');
          return;
        }

        this.expensesService.deleteCategory(category.id).subscribe();
      });
  }

  openTransactionDialog(type: TransactionType): void {
    this.newTransaction.type = type;
    this.showAddTransactionDialog = true;
  }

  addTransaction(): void {
    if (!this.isTransactionValid()) return;

    const transactionToAdd: Transaction = {
      id: Date.now(),
      description: this.newTransaction.description.trim(),
      amount: this.newTransaction.amount,
      type: this.newTransaction.type,
      category: this.selectedCategory?.name ?? '',
      categoryId: this.selectedCategory?.id ?? 0,
      date: this.newTransaction.date,
    };

    this.expensesService
      .addTransaction(transactionToAdd)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.closeDialogTrans(),
        error: (err) => {
          console.error('Ошибка при добавлении расходов', err);
        },
      });
  }

  isTransactionValid(): boolean {
    const baseValid =
      this.newTransaction.description.trim() &&
      this.newTransaction.amount > 0 &&
      this.newTransaction.date;

    if (this.newTransaction.type === TransactionType.Income) {
      return !!baseValid;
    }

    return !!(baseValid && this.selectedCategory);
  }

  deleteTransaction(transaction: Transaction): void {
    this.expensesService
      .deleteTransaction(transaction.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  private initComponentForm(): void {
    this.componentForm = this.fb.group({
      category: [null],
    });
  }

  private closeDialogCat(): void {
    this.showAddCategoryDialog = false;
    this.newCategory = { name: '', icon: '' };
  }

  private closeDialogTrans(): void {
    this.showAddTransactionDialog = false;
    this.newTransaction = {
      id: 0,
      description: '',
      amount: 0,
      type: TransactionType.Expense,
      category: '',
      categoryId: 0,
      date: new Date(),
    };
    this.selectedCategory = null;
  }
}
