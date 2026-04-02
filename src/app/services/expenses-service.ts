import { inject, Injectable } from '@angular/core';
import { Transaction} from '../models/transaction';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap} from 'rxjs';
import { Category } from '../models/category';

@Injectable({
  providedIn: 'root',
})
export class ExpensesService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000';

  private categoriesSubject = new BehaviorSubject<Category[]>([]);
  private transactionsSubject = new BehaviorSubject<Transaction[]>([]);

  categories$ = this.categoriesSubject.asObservable();
  transactions$ = this.transactionsSubject.asObservable();

  constructor() {
    this.loadCategories();
    this.loadTransactions();
  }

  private loadCategories(): void {
    this.http.get<Category[]>(`${this.apiUrl}/categories`).subscribe({
      next: (categories) => this.categoriesSubject.next(categories),
      error: (err) => console.error('Ошибка загрузки категорий', err),
    });
  }

  private loadTransactions(): void {
    this.http.get<Transaction[]>(`${this.apiUrl}/transactions`).subscribe({
      next: (transactions) => this.transactionsSubject.next(transactions),
      error: (err) => console.error('Ошибка при загрузке транзакций', err),
    });
  }

  addCategory(category: Category): Observable<Category> {
    return this.http.post<Category>(`${this.apiUrl}/categories`, category).pipe(
      tap((newCategory) => {
        const current = this.categoriesSubject.value;
        this.categoriesSubject.next([...current, newCategory]);
      })
    );
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/categories/${id}`).pipe(
      tap(() => {
        const current = this.categoriesSubject.value;
        this.categoriesSubject.next(current.filter((c) => c.id !== id));
      })
    )
  }

  addTransaction(transaction: Transaction): Observable<Transaction> {
    return this.http.post<Transaction>(`${this.apiUrl}/transactions`, transaction).pipe(
      tap((newTransaction) => {
        const current = this.transactionsSubject.value;
        this.transactionsSubject.next([...current, newTransaction]);
      })
    )
  }

  deleteTransaction(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/transactions/${id}`).pipe(
      tap(() => {
        const current = this.transactionsSubject.value;
        this.transactionsSubject.next(current.filter((t) => t.id !== id));
      })
    );
  }
}
