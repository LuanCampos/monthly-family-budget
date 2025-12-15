export const pt = {
  // App
  appTitle: 'Orçamento doméstico',
  appSubtitle: 'Controlando o orçamento doméstico da familinha com base nas nossas metas.',
  
  // Navigation & Actions
  import: 'Importar',
  export: 'Exportar',
  save: 'Salvar',
  cancel: 'Cancelar',
  add: 'Adicionar',
  edit: 'Editar',
  remove: 'Remover',
  confirm: 'Confirmar',
  back: 'Voltar',
  close: 'Fechar',
  
  // Month Selector
  selectMonth: 'Selecione um mês',
  newMonth: 'Novo mês',
  removeMonth: 'Remover mês',
  confirmRemoveMonth: 'Tem certeza que deseja remover este mês?',
  
  // Income
  monthlyIncome: 'Renda mensal',
  
  // Categories
  categories: 'Categorias',
  expenses: 'Gastos',
  summary: 'Resumo',
  goals: 'Metas',
  
  // Category Names
  'custos-fixos': 'Custos Fixos',
  'conforto': 'Conforto',
  'metas': 'Metas',
  'prazeres': 'Prazeres',
  'liberdade': 'Liberdade Financeira',
  'conhecimento': 'Conhecimento',
  
  // Expense List
  monthExpenses: 'Gastos do mês',
  noExpenses: 'Nenhum gasto registrado',
  addExpense: 'Adicionar gasto',
  editExpense: 'Editar gasto',
  expenseTitle: 'Título',
  expenseValue: 'Valor',
  expenseCategory: 'Categoria',
  expenseSubcategory: 'Subcategoria',
  
  // Recurring Expenses
  recurringExpenses: 'Gastos recorrentes',
  addRecurringExpense: 'Adicionar gasto recorrente',
  editRecurringExpense: 'Editar gasto recorrente',
  dueDay: 'Dia de vencimento',
  hasInstallments: 'Prazo determinado',
  totalInstallments: 'Número de parcelas',
  startMonth: 'Mês inicial',
  startYear: 'Ano inicial',
  installment: 'Parcela',
  
  // Pending Payment
  pendingPayment: 'Pagamento pendente',
  confirmPayment: 'Confirmar pagamento',
  confirmPaymentMessage: 'Deseja confirmar o pagamento deste gasto?',
  dueOn: 'Vence dia',
  
  // Subcategories
  subcategories: 'Subcategorias',
  addSubcategory: 'Adicionar subcategoria',
  editSubcategory: 'Editar subcategoria',
  subcategoryName: 'Nome da subcategoria',
  
  // Summary
  spent: 'Gasto',
  budget: 'Orçamento',
  remaining: 'Restante',
  total: 'Total',
  used: 'Utilizado',
  
  // Goals
  editGoals: 'Editar metas',
  percentage: 'Porcentagem',
  
  // Filters
  all: 'Todos',
  recurring: 'Recorrentes',
  pending: 'Pendentes',
  
  // Empty States
  emptyStateTitle: 'Comece adicionando um mês para gerenciar seu orçamento.',
  emptyStateSubtitle: 'Clique no botão + ao lado do seletor de mês.',
  
  // Update Options
  updateRecurringTitle: 'Atualizar gasto recorrente',
  updateFutureOnly: 'Apenas gastos futuros',
  updateAll: 'Todos os gastos (incluindo anteriores)',
  
  // Settings
  settings: 'Configurações',
  language: 'Idioma',
  theme: 'Tema',
  
  // Languages
  portuguese: 'Português',
  english: 'English',
  
  // Themes
  themeDark: 'Escuro',
  themeLight: 'Claro',
  themeNord: 'Nord',
  themeDracula: 'Dracula',
  themeSolarized: 'Solarized',
  themeGruvbox: 'Gruvbox',
  themeCatppuccin: 'Catppuccin',
};

export type TranslationKey = keyof typeof pt;
