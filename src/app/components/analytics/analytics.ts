import { Component, inject } from '@angular/core';
import { DecimalPipe, AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChartData, ChartOptions } from 'chart.js';
import { BehaviorSubject, combineLatest, map } from 'rxjs';
import { ExpensesService } from '../../services/expenses-service';
import { Transaction, TransactionType } from '../../models/transaction';
import { SelectButton } from 'primeng/selectbutton';
import { ChartModule } from 'primeng/chart';

@Component({
  selector: 'app-analytics',
  imports: [ChartModule, DecimalPipe, AsyncPipe, FormsModule, SelectButton],
  templateUrl: './analytics.html',
  styleUrl: './analytics.scss',
})
export class AnalyticsComponent {
  private expensesService = inject(ExpensesService);

  private selectedPeriodSubject = new BehaviorSubject<'all' | 'month' | 'year'>('all');
  selectedPeriod$ = this.selectedPeriodSubject.asObservable();
  selectedPeriod: 'all' | 'month' | 'year' = 'all';

  periodOptions = [
    { label: 'Все', value: 'all' },
    { label: 'Месяц', value: 'month' },
    { label: 'Год', value: 'year' },
  ];

  readonly monthNames = [
    'Январь',
    'Февраль',
    'Март',
    'Апрель',
    'Май',
    'Июнь',
    'Июль',
    'Август',
    'Сентябрь',
    'Октябрь',
    'Ноябрь',
    'Декабрь',
  ];

  onPeriodChange(period: 'all' | 'month' | 'year') {
    this.selectedPeriodSubject.next(period);
    this.selectedPeriod = period;
  }

  private transactions$ = this.expensesService.transactions$;

  private filteredTransactions$ = combineLatest([this.transactions$, this.selectedPeriod$]).pipe(
    map(([transactions, period]) => this.filterTransactions(transactions, period)),
  );

  private analytics$ = this.filteredTransactions$.pipe(
    map((transactions) => this.calculateAnalytics(transactions)),
  );

  private average$ = this.filteredTransactions$.pipe(
    map((transactions) => this.calculateAverageMonthlyExpense(transactions)),
  );

  pieData$ = this.analytics$.pipe(
    map((analytics) => {
      const grouped = analytics.categories;
      const categoryColors = this.generateCategoryColors(Object.keys(grouped).length);

      if (Object.keys(grouped).length === 0) {
        return { labels: [], datasets: [] } as ChartData<'pie'>;
      }

      return {
        labels: Object.keys(grouped),
        datasets: [
          {
            data: Object.values(grouped),
            backgroundColor: categoryColors,
          },
        ],
      } as ChartData<'pie'>;
    }),
  );

  barData$ = this.analytics$.pipe(
    map((analytics) => {
      const incomeColor = this.getCssVariable('--p-primary-300');
      const expenseColor = this.getCssVariable('--p-primary-900');

      return {
        labels: ['Доходы', 'Расходы'],
        datasets: [
          {
            label: 'Сумма',
            data: [analytics.income, analytics.expense],
            backgroundColor: [incomeColor, expenseColor],
          },
        ],
      } as ChartData<'bar'>;
    }),
  );

  lineData$ = this.filteredTransactions$.pipe(
    map((transactions) => {
      const monthlyMap: Record<string, { income: number; expense: number }> = {};

      transactions.forEach((t) => {
        const date = new Date(t.date);
        if (isNaN(date.getTime())) return;
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const key = `${year}-${month.toString().padStart(2, '0')}`;

        if (!monthlyMap[key]) {
          monthlyMap[key] = { income: 0, expense: 0 };
        }
        if (t.type === TransactionType.Income) {
          monthlyMap[key].income += t.amount;
        } else {
          monthlyMap[key].expense += t.amount;
        }
      });

      const sortedMonth = Object.keys(monthlyMap).sort((a, b) => a.localeCompare(b));

      const formattedLabels = sortedMonth.map((key) => {
        const [year, month] = key.split('-');
        return `${this.monthNames[parseInt(month) - 1]} ${year}`;
      });

      const incomeData = sortedMonth.map((m) => monthlyMap[m].income);
      const expenseData = sortedMonth.map((m) => monthlyMap[m].expense);

      const incomeColor = this.getCssVariable('--p-primary-300');
      const expenseColor = this.getCssVariable('--p-primary-900');

      return {
        labels: formattedLabels,
        datasets: [
          {
            label: 'Доходы',
            data: incomeData,
            borderColor: incomeColor,
            backgroundColor: 'transparent',
            tension: 0.4,
            pointRadius: 5,
          },
          {
            label: 'Расходы',
            data: expenseData,
            borderColor: expenseColor,
            backgroundColor: 'transparent',
            tension: 0.4,
          },
        ],
      } as ChartData<'line'>;
    }),
  );

  vm$ = combineLatest({
    analytics: this.analytics$,
    average: this.average$,
    pie: this.pieData$,
    bar: this.barData$,
    line: this.lineData$,
  });

  pieOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: getComputedStyle(document.documentElement)
            .getPropertyValue('--p-text-muted-color')
            .trim(),
          font: {
            size: 12,
            family: 'Open-Sans',
          },
        },
      },
      tooltip: this.getTooltipOptions(),
    },
  };

  barOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: this.getTooltipOptions(),
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          font: { size: 12, family: 'Open-Sans' },
          color: this.getCssVariable('--p-text-muted-color'),
        },
        title: {
          display: true,
          font: { size: 14, weight: 'bold' as const },
          color: this.getCssVariable('--heading-color'),
        },
      },
      x: {
        ticks: {
          font: { size: 12, family: 'Open-Sans' },
          color: this.getCssVariable('--p-text-muted-color'),
        },
        title: {
          display: true,
          font: { size: 14, weight: 'bold' as const },
          color: this.getCssVariable('--heading-color'),
        },
      },
    },
  };

  lineOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: { size: 12, family: 'Inter_Bold' },
          color: this.getCssVariable('--p-text-muted-color'),
        },
      },
      tooltip: this.getTooltipOptions(),
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          font: { size: 12, family: 'Open-Sans' },
          color: this.getCssVariable('--p-text-muted-color'),
        },
      },
      x: {
        ticks: {
          font: { size: 12, family: 'Open-Sans' },
          color: this.getCssVariable('--p-text-muted-color'),
          maxRotation: 45, // для длинных подписей
          autoSkip: true,
        },
      },
    },
  };

  private filterTransactions(
    transactions: Transaction[],
    period: 'all' | 'month' | 'year',
  ): Transaction[] {
    const now = new Date();

    if (period === 'month') {
      return transactions.filter((t) => {
        const d = new Date(t.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
    }

    if (period === 'year') {
      return transactions.filter((t) => {
        const d = new Date(t.date);
        return d.getFullYear() === now.getFullYear();
      });
    }
    return transactions;
  }

  private calculateAnalytics(transactions: Transaction[]) {
    const income = transactions
      .filter((t) => t.type === TransactionType.Income)
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = transactions
      .filter((t) => t.type === TransactionType.Expense)
      .reduce((sum, t) => sum + t.amount, 0);

    const grouped: Record<string, number> = {};

    transactions
      .filter((t) => t.type === TransactionType.Expense)
      .forEach((t) => {
        if (!t.category) return;

        if (!grouped[t.category]) {
          grouped[t.category] = 0;
        }
        grouped[t.category] += t.amount;
      });

    const savingRate = income > 0 ? ((income - expense) / income) * 100 : 0;

    const topCategories = Object.entries(grouped)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, amount]) => ({
        name,
        amount,
      }));

    return {
      income,
      expense,
      balance: income - expense,
      savingRate,
      categories: grouped,
      topCategories,
    };
  }

  private calculateAverageMonthlyExpense(transactions: Transaction[]) {
    const expense = transactions.filter((t) => t.type === TransactionType.Expense);
    if (expense.length === 0) {
      return { averageMonthlyExpense: 0 };
    }

    const dates = expense.map((t) => new Date(t.date));

    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

    const months =
      (maxDate.getFullYear() - minDate.getFullYear()) * 12 +
      (maxDate.getMonth() - minDate.getMonth()) +
      1;

    const totalExpense = expense.reduce((sum, t) => sum + t.amount, 0);

    const averageMonthlyExpense = totalExpense / months;

    return { averageMonthlyExpense };
  }

  private getCssVariable(name: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  private hexToHsl(hex: string): { h: number; s: number; l: number } {
    if (!hex || hex === '') {
      return { h: 0, s: 0, l: 50 };
    }
    let cleanHex = hex.replace('#', '');
    if (cleanHex.length === 3) {
      cleanHex = cleanHex
        .split('')
        .map((c) => c + c)
        .join('');
    }
    const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
    const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
    const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0,
      s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }
    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    };
  }

  private generateCategoryColors(count: number): string[] {
    const baseColor = this.getCssVariable('--p-primary-500') || '#78a9d7';
    const { h: baseH, s, l } = this.hexToHsl(baseColor);

    const goldenAngle = 137.5;
    const colors: string[] = [];

    for (let i = 0; i < count; i++) {
      const hue = (baseH + i * goldenAngle) % 360;
      colors.push(`hsl(${Math.round(hue)}, ${s}%, ${l}%)`);
    }
    return colors;
  }

  private getTooltipOptions() {
    return {
      backgroundColor: '#fff',
      titleColor: '#6f7987',
      bodyColor: '#6f7987',
      borderColor: '#6f7987',
      borderWidth: 1,
      padding: 10,
      cornerRadius: 12,
    };
  }
}
