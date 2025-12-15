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
  delete: 'Excluir',
  
  // Month Selector
  selectMonth: 'Selecione um mês',
  noMonthSelected: 'Nenhum mês selecionado',
  addMonth: 'Adicionar Mês',
  deleteMonth: 'Excluir mês',
  deleteMonthConfirm: 'Tem certeza que deseja excluir o mês',
  deleteMonthWarning: 'Esta ação não pode ser desfeita.',
  
  // Income
  monthlyIncome: 'Renda do mês',
  
  // Categories
  categories: 'Categorias',
  expenses: 'Gastos',
  summary: 'Resumo',
  goals: 'Metas',
  
  // Category Names (capitalized)
  'essenciais': 'Essenciais',
  'conforto': 'Conforto',
  'metas': 'Metas',
  'prazeres': 'Prazeres',
  'liberdade': 'Liberdade Financeira',
  'conhecimento': 'Conhecimento',
  
  // Summary Table
  budget: 'Orçamento',
  amountSpent: 'Valor Gasto',
  shouldSpend: 'Devo Gastar',
  used: 'Utilizado',
  totalSpent: 'Total gastos',
  totalRemaining: 'Total a gastar',
  
  // Expense List
  monthExpenses: 'Gastos do mês',
  noExpenses: 'Nenhum gasto registrado',
  addExpense: 'Adicionar Gasto',
  newExpense: 'Novo Gasto',
  editExpense: 'Editar Gasto',
  expenseTitle: 'Título',
  expenseValue: 'Valor',
  expenseCategory: 'Categoria',
  expenseSubcategory: 'Subcategoria',
  saveChanges: 'Salvar alterações',
  
  // Recurring Expenses
  recurringExpenses: 'Gastos Recorrentes',
  addRecurringExpense: 'Adicionar Recorrente',
  newRecurringExpense: 'Novo Gasto Recorrente',
  editRecurringExpense: 'Editar Gasto Recorrente',
  recurringExpensesDescription: 'Estes gastos são adicionados automaticamente a cada novo mês.',
  noRecurringExpenses: 'Nenhum gasto recorrente cadastrado',
  dueDay: 'Dia de vencimento',
  day: 'Dia',
  hasInstallments: 'Prazo determinado',
  totalInstallments: 'Número de parcelas',
  startMonth: 'Mês inicial',
  startYear: 'Ano inicial',
  installment: 'Parcela',
  
  // Pending Payment
  pendingPayment: 'Pagamento Pendente',
  confirmPayment: 'Confirmar pagamento',
  confirmPaymentMessage: 'Deseja confirmar o pagamento deste gasto?',
  dueOn: 'Vence dia',
  
  // Subcategories
  subcategories: 'Sub-categorias',
  manageSubcategories: 'Gerenciar Sub-categorias',
  addSubcategory: 'Adicionar subcategoria',
  editSubcategory: 'Editar subcategoria',
  subcategoryName: 'Nome da sub-categoria',
  noSubcategories: 'Nenhuma sub-categoria',
  
  // Goals
  editGoals: 'Editar Metas',
  percentage: 'Porcentagem',
  total: 'Total',
  
  // Filters
  all: 'Todos',
  recurring: 'Recorrentes',
  pending: 'Pendentes',
  
  // Empty States
  emptyStateTitle: 'Comece adicionando um mês para gerenciar seu orçamento.',
  emptyStateSubtitle: 'Clique no botão + ao lado do seletor de mês.',
  
  // Update Options
  updateRecurringTitle: 'Aplicar alterações',
  updateRecurringDescription: 'Deseja aplicar as alterações apenas aos gastos futuros ou também atualizar os gastos já criados em meses anteriores?',
  updateFutureOnly: 'Apenas Futuros',
  updateAll: 'Atualizar Todos',
  
  // Settings
  settings: 'Configurações',
  language: 'Idioma',
  theme: 'Tema',
  backup: 'Backup',
  backupDescription: 'Exporte seus dados para fazer backup ou importe um backup existente.',
  importBackup: 'Importar Backup',
  exportBackup: 'Exportar Backup',
  
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
  
  // Months
  'month-0': 'Janeiro',
  'month-1': 'Fevereiro',
  'month-2': 'Março',
  'month-3': 'Abril',
  'month-4': 'Maio',
  'month-5': 'Junho',
  'month-6': 'Julho',
  'month-7': 'Agosto',
  'month-8': 'Setembro',
  'month-9': 'Outubro',
  'month-10': 'Novembro',
  'month-11': 'Dezembro',
};

export type TranslationKey = keyof typeof pt;
