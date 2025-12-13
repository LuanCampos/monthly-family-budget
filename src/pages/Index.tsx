import { useBudget } from '@/hooks/useBudget';
import { MonthSelector } from '@/components/MonthSelector';
import { IncomeInput } from '@/components/IncomeInput';
import { ExpenseChart } from '@/components/ExpenseChart';
import { CategoryLegend } from '@/components/CategoryLegend';
import { SummaryTable } from '@/components/SummaryTable';
import { GoalsPanel } from '@/components/GoalsPanel';
import { ExpenseForm } from '@/components/ExpenseForm';
import { RecurringExpenses } from '@/components/RecurringExpenses';
import { ExpenseList } from '@/components/ExpenseList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Index = () => {
  const {
    months,
    currentMonth,
    currentMonthId,
    recurringExpenses,
    addMonth,
    selectMonth,
    updateIncome,
    addExpense,
    removeExpense,
    addRecurringExpense,
    removeRecurringExpense,
    getCategorySummary,
    getTotals,
  } = useBudget();

  const categorySummary = getCategorySummary();
  const { totalSpent, totalBudget, usedPercentage } = getTotals();
  const hasExpenses = currentMonth ? currentMonth.expenses.length > 0 : false;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8 animate-fade-in">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Orçamento doméstico
          </h1>
          <p className="text-muted-foreground">
            Controle seu orçamento doméstico com base em suas próprias metas e rendimentos.
          </p>
        </header>

        {/* Controls */}
        <div className="flex flex-wrap items-end gap-4 mb-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <MonthSelector
            months={months}
            currentMonth={currentMonth}
            onSelectMonth={selectMonth}
            onAddMonth={addMonth}
          />
          <IncomeInput
            value={currentMonth?.income || 0}
            onChange={updateIncome}
            disabled={!currentMonthId}
          />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Gastos */}
          <Card className="lg:col-span-3 bg-card border-border animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <CardHeader>
              <CardTitle className="text-foreground">Gastos</CardTitle>
            </CardHeader>
            <CardContent>
              <ExpenseChart
                data={categorySummary.map(c => ({
                  key: c.key,
                  name: c.name,
                  spent: c.spent,
                  color: c.color,
                }))}
                hasExpenses={hasExpenses}
              />
              <CategoryLegend />
            </CardContent>
          </Card>

          {/* Center Column - Resumo */}
          <Card className="lg:col-span-6 bg-card border-border animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <CardHeader>
              <CardTitle className="text-foreground">Resumo</CardTitle>
            </CardHeader>
            <CardContent>
              <SummaryTable
                categories={categorySummary}
                totalSpent={totalSpent}
                totalBudget={totalBudget}
                usedPercentage={usedPercentage}
              />
            </CardContent>
          </Card>

          {/* Right Column - Metas */}
          <Card className="lg:col-span-3 bg-card border-border animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <CardHeader>
              <CardTitle className="text-foreground">Metas</CardTitle>
            </CardHeader>
            <CardContent>
              <GoalsPanel />
            </CardContent>
          </Card>
        </div>

        {/* Expense List Section */}
        {currentMonthId && (
          <Card className="mt-6 bg-card border-border animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-foreground">Gastos do mês</CardTitle>
              <div className="flex gap-2">
                <RecurringExpenses
                  expenses={recurringExpenses}
                  onAdd={addRecurringExpense}
                  onRemove={removeRecurringExpense}
                />
                <ExpenseForm onAdd={addExpense} disabled={!currentMonthId} />
              </div>
            </CardHeader>
            <CardContent>
              <ExpenseList
                expenses={currentMonth?.expenses || []}
                onRemove={removeExpense}
              />
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!currentMonthId && (
          <div className="mt-12 text-center animate-fade-in">
            <p className="text-muted-foreground text-lg mb-4">
              Comece adicionando um mês para gerenciar seu orçamento.
            </p>
            <p className="text-muted-foreground text-sm">
              Clique no botão + ao lado do seletor de mês.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
