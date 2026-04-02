import { Routes } from '@angular/router';
import { ExpensesComponent } from './components/expenses/expenses';
import { AnalyticsComponent } from './components/analytics/analytics';
import { ProfileComponent } from './components/profile/profile';
import { SettingsComponent } from './components/settings/settings';

export const routes: Routes = [
    {path: '', redirectTo: '/home', pathMatch: 'full'},
    {path: 'home', component: ExpensesComponent},
    {path: 'profile', component: ProfileComponent},
    {path: 'analytics', component: AnalyticsComponent},
    {path: 'settings', component: SettingsComponent},
    {path: '**', redirectTo: 'home'}
];
