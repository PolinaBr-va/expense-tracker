import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnalyticsComponent } from './analytics';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { Transaction, TransactionType } from '../../models/transaction';
import { ExpensesService } from '../../services/expenses-service';

class MockExpensesService {
  transactions$ = new BehaviorSubject<Transaction[]>([]);
}

describe('AnalyticsComponent', () => {
  let component: AnalyticsComponent;
  let fixture: ComponentFixture<AnalyticsComponent>;
  let mockExpensesService: MockExpensesService;

  beforeEach(async () => {
    mockExpensesService = new MockExpensesService();

    spyOn(window, 'getComputedStyle').and.returnValue({
      getPropertyValue: () => '#000',
    } as any);

    await TestBed.configureTestingModule({
      imports: [AnalyticsComponent],
      providers: [{ provide: ExpensesService, useValue: mockExpensesService }],
    }).compileComponents();

    fixture = TestBed.createComponent(AnalyticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('logic methods', () => {
    it('should filter transactions by month', () => {
      const now = new Date();

      const data: Transaction[] = [
        { amount: 100, type: TransactionType.Expense, date: now.toISOString() },
        { amount: 200, type: TransactionType.Expense, date: '2020-01-01' },
      ] as any;

      const result = (component as any).filterTransactions(data, 'month');
      expect(result.length).toBe(1);
      expect(result[0].amount).toBe(100);
    });

    it('should filter transactions by year', () => {
      const now = new Date();

      const data: Transaction[] = [
        { amount: 100, type: TransactionType.Expense, date: now.toISOString() },
        { amount: 200, type: TransactionType.Expense, date: '2020-01-01' },
      ] as any;

      const result = (component as any).filterTransactions(data, 'year');
      expect(result.length).toBe(1);
      expect(result[0].amount).toBe(100);
    });

    it('should return all transactions for "all" period', () => {
      const now = new Date();

      const data: Transaction[] = [
        { amount: 100, type: TransactionType.Expense, date: now.toISOString() },
        { amount: 200, type: TransactionType.Expense, date: '2020-01-01' },
      ] as any;

      const result = (component as any).filterTransactions(data, 'all');
      expect(result.length).toBe(2);
    });

    it('should calculate income, expense and balance', () => {
      const data: Transaction[] = [
        { amount: 100, type: TransactionType.Income },
        { amount: 50, type: TransactionType.Expense, category: 'Food' },
        { amount: 30, type: TransactionType.Expense, category: 'Transport' },
      ] as any;

      const result = (component as any).calculateAnalytics(data);

      expect(result.income).toBe(100);
      expect(result.expense).toBe(80);
      expect(result.balance).toBe(20);
    });

    it('should calculate average monthly expense', () => {
      const data: Transaction[] = [
        { amount: 200, type: TransactionType.Income, date: '2024-01-01' },
        { amount: 100, type: TransactionType.Expense, date: '2024-01-15' },
        { amount: 100, type: TransactionType.Expense, date: '2024-02-10' },
      ] as any;

      const result = (component as any).calculateAverageMonthlyExpense(data);

      expect(result.averageMonthlyExpense).toBe(100);
    });

    it('should return zero average if no expenses', () => {
      const data: Transaction[] = [
        { amount: 200, type: TransactionType.Income, date: '2024-01-01' },
      ] as any;

      const result = (component as any).calculateAverageMonthlyExpense(data);

      expect(result.averageMonthlyExpense).toBe(0);
    });
  });

  describe('period filtering', () => {
    it('should update filteredTransactions$ when period changes', async () => {
      const now = new Date();
      const transactionThisMonth: Transaction = {
        amount: 100,
        type: TransactionType.Expense,
        date: now.toISOString(),
        category: 'Food',
      } as any;

      const transactionLastYear: Transaction = {
        amount: 200,
        type: TransactionType.Expense,
        date: '2020-01-01',
        category: 'Food',
      } as any;

      mockExpensesService.transactions$.next([transactionThisMonth, transactionLastYear]);
      let filtered = await firstValueFrom<Transaction[]>((component as any).filteredTransactions$);

      expect(filtered.length).toBe(2);

      component.onPeriodChange('month');
      fixture.detectChanges();
      filtered = await firstValueFrom((component as any).filteredTransactions$);
      expect(filtered.length).toBe(1);
      expect(filtered[0].amount).toBe(100);

      component.onPeriodChange('all');
      fixture.detectChanges();
      filtered = await firstValueFrom((component as any).filteredTransactions$);
      expect(filtered.length).toBe(2);
    });
  });

  describe('chart data streams', () => {
    const mockTransactions: Transaction[] = [
      {
        amount: 200,
        type: TransactionType.Income,
        date: '2024-01-10',
        category: 'Salary',
      } as any,
      {
        amount: 50,
        type: TransactionType.Expense,
        date: '2024-01-15',
        category: 'Food',
      } as any,
      {
        amount: 30,
        type: TransactionType.Expense,
        date: '2024-01-20',
        category: 'Transport',
      } as any,
      {
        amount: 100,
        type: TransactionType.Income,
        date: '2024-02-05',
        category: 'Freelance',
      } as any,
      {
        amount: 70,
        type: TransactionType.Expense,
        date: '2024-02-10',
        category: 'Food',
      } as any,
    ];

    beforeEach(() => {
      mockExpensesService.transactions$.next(mockTransactions);
    });

    it('should produce valid pie chart data', async () => {
      const pieData = await firstValueFrom(component.pieData$);
      expect(pieData).toBeDefined();
      expect(pieData.labels).toEqual(['Food', 'Transport']);
      expect(pieData.datasets?.length).toBe(1);
      expect(pieData.datasets?.[0].data).toEqual([120, 30]);
      expect(pieData.datasets?.[0].backgroundColor).toBeDefined();
      expect(pieData.datasets?.[0].backgroundColor).toBeInstanceOf(Array);
      expect((pieData.datasets?.[0].backgroundColor as any[]).length).toBe(2);
    });

    it('should produce valid bar chart data', async () => {
      const barData = await firstValueFrom(component.barData$);
      expect(barData).toBeDefined();
      expect(barData.labels).toEqual(['Доходы', 'Расходы']);
      expect(barData.datasets?.length).toBe(1);
      expect(barData.datasets?.[0].data).toEqual([300, 150]);
      expect(barData.datasets?.[0].backgroundColor).toBeInstanceOf(Array);
      expect((barData.datasets?.[0].backgroundColor as any[]).length).toBe(2);
    });

    it('should produce valid line chart data (monthly dynamic)', async () => {
      const lineData = await firstValueFrom(component.lineData$);
      expect(lineData).toBeDefined();
      expect(lineData.labels).toEqual(['Январь 2024', 'Февраль 2024']);
      expect(lineData.datasets?.length).toBe(2);
      const incomeDataset = lineData.datasets?.find((d) => d.label === 'Доходы');
      const expenseDataset = lineData.datasets?.find((d) => d.label === 'Расходы');
      expect(incomeDataset?.data).toEqual([200, 100]);
      expect(expenseDataset?.data).toEqual([80, 70]);
    });

    it('should handle empty transactions gracefully', async () => {
      mockExpensesService.transactions$.next([]);
      const pieData = await firstValueFrom(component.pieData$);
      expect(pieData.labels).toEqual([]);
      expect(pieData.datasets).toEqual([]);

      const barData = await firstValueFrom(component.barData$);
      expect(barData.datasets?.[0].data).toEqual([0, 0]);

      const lineData = await firstValueFrom(component.lineData$);
      expect(lineData.labels).toEqual([]);
      expect(lineData.datasets?.[0].data).toEqual([]);
    });
  });

  describe('generateCategoryColors', () => {
    it('should return array of correct length', () => {
      const colors = (component as any).generateCategoryColors(5) as string[];
      expect(colors.length).toBe(5);
    });

    it('should return colors in HSL format', () => {
      const colors = (component as any).generateCategoryColors(3) as string[];
      colors.forEach((color) => {
        expect(color).toMatch(/^hsl\(\d+,\s*\d+%,\s*\d+%\)$/);
      });
    });

    it('should generate different colors for different indices', () => {
      const colors = (component as any).generateCategoryColors(4) as string[];
      const unique = new Set(colors);
      expect(unique.size).toBe(4);
    });

    it('should return empty array when count is 0', () => {
      const colors = (component as any).generateCategoryColors(0) as string[];
      const unique = new Set(colors);
      expect(colors).toEqual([]);
    });
  });

  describe('vm$ and DOM rendering', () => {
    it('should update vm$ when transactions change', async () => {
      mockExpensesService.transactions$.next([
        { amount: 100, type: TransactionType.Income, date: new Date().toISOString() },
      ] as any);
      const vm = await firstValueFrom(component.vm$);

      expect(vm.analytics.income).toBe(100);
    });

    it('should display balance in the template', async () => {
      mockExpensesService.transactions$.next([
        { amount: 500, type: TransactionType.Income, date: new Date().toISOString() },
        { amount: 200, type: TransactionType.Expense, date: new Date().toISOString() },
      ] as any);

      fixture.detectChanges();
      await fixture.whenStable();

      const balanceParagraph = fixture.nativeElement.querySelector('.stats-card.balance p');
      expect(balanceParagraph.textContent).toContain('300');
    });

    it('should display top categories list', async () => {
      mockExpensesService.transactions$.next([
        {
          amount: 100,
          type: TransactionType.Expense,
          date: new Date().toISOString(),
          category: 'Food',
        },
        {
          amount: 200,
          type: TransactionType.Expense,
          date: new Date().toISOString(),
          category: 'Transport',
        },
        {
          amount: 50,
          type: TransactionType.Expense,
          date: new Date().toISOString(),
          category: 'Entertainment',
        },
      ] as any);

      fixture.detectChanges();
      await fixture.whenStable();

      const topCategoriesList = fixture.nativeElement.querySelector('.top-categories ul');
      expect(topCategoriesList.textContent).toContain('Transport');
      expect(topCategoriesList.textContent).toContain('Food');
      expect(topCategoriesList.textContent).toContain('Entertainment');
    });
  });
});
