import { useState } from 'react';
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
import { Expense, CategoryKey } from '@/types/budget';
import { Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    updateExpense,
    addRecurringExpense,
    removeRecurringExpense,
    getCategorySummary,
    getTotals,
    exportBudget,
    importBudget,
    updateRecurringExpense,
  } = useBudget();

  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const categorySummary = getCategorySummary();
  const { totalSpent, totalBudget, usedPercentage } = getTotals();
  const hasExpenses = currentMonth ? currentMonth.expenses.length > 0 : false;

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
  };

  const handleUpdateExpense = (
    id: string,
    title: string,
    category: CategoryKey,
    value: number
  ) => {
    updateExpense(id, title, category, value);
    setEditingExpense(null);
  };
  
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      importBudget(file);
      e.target.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8 animate-fade-in flex items-start justify-between">
          {/* Left side */}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Orçamento doméstico
            </h1>
            <p className="text-muted-foreground">
              Controlando o orçamento doméstico da familinha com base nas nossas metas.
            </p>
          </div>
        
          {/* Right side – Import / Export */}
          <div className="flex gap-2">
            <input
              type="file"
              accept=".json"
              id="import-budget"
              className="hidden"
              onChange={handleImportFile}
            />
        
            <Button
              variant="outline"
              onClick={() => document.getElementById('import-budget')?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Importar
            </Button>
        
            <Button variant="outline" onClick={exportBudget}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </header>

        {/* Controls */}
        <div
          className="flex flex-wrap items-end gap-4 mb-8 animate-fade-in"
          style={{ animationDelay: '0.1s' }}
        >
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
          <Card
            className="lg:col-span-3 bg-card border-border animate-fade-in"
            style={{ animationDelay: '0.2s' }}
          >
            <CardHeader>
              <CardTitle className="text-foreground">Gastos</CardTitle>
            </CardHeader>
            <CardContent>
              <ExpenseChart
                data={categorySummary.map((c) => ({
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
          <Card
            className="lg:col-span-6 bg-card border-border animate-fade-in"
            style={{ animationDelay: '0.3s' }}
          >
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
          <Card
            className="lg:col-span-3 bg-card border-border animate-fade-in"
            style={{ animationDelay: '0.4s' }}
          >
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
          <Card
            className="mt-6 bg-card border-border animate-fade-in"
            style={{ animationDelay: '0.5s' }}
          >
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-foreground">Gastos do mês</CardTitle>
              <div className="flex gap-2">
                <RecurringExpenses
                  expenses={recurringExpenses}
                  onAdd={addRecurringExpense}
                  onUpdate={updateRecurringExpense}
                  onRemove={removeRecurringExpense}
                />
                <ExpenseForm
                  mode="create"
                  onAdd={addExpense}
                  disabled={!currentMonthId}
                />
              </div>
            </CardHeader>

            <CardContent>
              <ExpenseList
                expenses={currentMonth?.expenses || []}
                onRemove={removeExpense}
                onEdit={handleEditExpense}
              />
            </CardContent>
          </Card>
        )}

        {/* Expense Edit Modal */}
        {editingExpense && (
          <ExpenseForm
            mode="edit"
            initialData={editingExpense}
            onUpdate={handleUpdateExpense}
            onCancel={() => setEditingExpense(null)}
          />
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
