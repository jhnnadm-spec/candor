/**
 * A plain-English name and one-line meaning for every line of the four financial
 * statements. Lines are matched first by their official tag (the same tag means the
 * same thing at every company), then by the words in the company's own label, and
 * last by where the line sits (under "Current assets", "Investing activities" …).
 */
import type { StatementKind } from "../sec/rpages";

export type LinePlain = { plain: string; what: string };
export type Section =
  | "currentAssets"
  | "assets"
  | "currentLiabilities"
  | "liabilities"
  | "equity"
  | "operating"
  | "investing"
  | "financing"
  | "supplemental"
  | "none";

const L = (plain: string, what: string): LinePlain => ({ plain, what });

/** Official tags (without their "us-gaap_" prefix). */
const BY_TAG: Record<string, LinePlain> = {
  // ---------------------------------------------------------------- income statement: sales
  Revenues: L("Sales", "All the money it brought in from customers in this period, before any costs (revenue)."),
  RevenueFromContractWithCustomerExcludingAssessedTax: L("Sales", "All the money it brought in from customers in this period, before any costs (revenue)."),
  RevenueFromContractWithCustomerIncludingAssessedTax: L("Sales, including sales taxes collected", "Money from customers, counting taxes it collects and passes on to governments."),
  SalesRevenueNet: L("Sales", "All the money it brought in from customers in this period, before any costs (revenue)."),
  SalesRevenueGoodsNet: L("Sales of products", "Money from selling physical products."),
  SalesRevenueServicesNet: L("Sales of services", "Money from services, subscriptions and support."),
  RevenuesNetOfInterestExpense: L("Total revenue, after interest paid", "For a bank: interest earned minus interest paid, plus all fee income. Its version of sales."),
  // ---- costs
  CostOfRevenue: L("Cost of making what it sold", "What the products and services it sold cost to make, buy or deliver: materials, factory work, shipping, support staff."),
  CostOfGoodsAndServicesSold: L("Cost of making what it sold", "What the products and services it sold cost to make, buy or deliver: materials, factory work, shipping, support staff."),
  CostOfGoodsSold: L("Cost of making the products sold", "What the products it sold cost to make or buy."),
  CostOfServices: L("Cost of providing services", "What it cost to deliver the services it sold: staff, data centres, support."),
  GrossProfit: L("Profit after making costs (gross profit)", "Sales minus the cost of making what was sold. What is left to pay for research, marketing, offices and everything else."),
  ResearchAndDevelopmentExpense: L("Research and development", "Spending on inventing and improving products: engineers, scientists, labs and testing."),
  ResearchAndDevelopmentExpenseExcludingAcquiredInProcessCost: L("Research and development", "Spending on inventing and improving products: engineers, scientists, labs and testing."),
  SellingGeneralAndAdministrativeExpense: L("Selling and running costs (SG&A)", "Marketing, sales staff, head office, managers, lawyers and the other costs of running the company."),
  SellingAndMarketingExpense: L("Selling and marketing", "Advertising, sales teams and promotions."),
  MarketingAndAdvertisingExpense: L("Marketing and advertising", "Money spent getting customers to notice and buy."),
  GeneralAndAdministrativeExpense: L("Running the company (general and administrative)", "Head office, managers, finance, legal and other overheads."),
  OperatingExpenses: L("Total running costs (operating expenses)", "All the regular costs of running the business beyond making the products."),
  CostsAndExpenses: L("Total costs", "Every regular cost of running the business added together."),
  OperatingCostsAndExpenses: L("Total running costs", "Every regular cost of running the business added together."),
  DepreciationAndAmortization: L("Wear and tear (depreciation and amortization)", "The cost of buildings, equipment and other long-lasting things, spread over the years they are used."),
  DepreciationDepletionAndAmortization: L("Wear and tear (depreciation and amortization)", "The cost of buildings, equipment and other long-lasting things, spread over the years they are used. It uses no cash this year."),
  AmortizationOfIntangibleAssets: L("Spreading the cost of bought patents and brands (amortization)", "The cost of intangibles it bought, such as patents or customer lists, spread over the years they help."),
  RestructuringCharges: L("Restructuring costs", "One-off costs of reorganising, such as job cuts or closing sites."),
  AssetImpairmentCharges: L("Write-down of asset values (impairment)", "Lowering the recorded value of things it owns because they are worth less than thought. No cash is spent."),
  GoodwillImpairmentLoss: L("Write-down of goodwill (impairment)", "Admitting a business it bought is worth less than it paid. No cash is spent."),
  OperatingIncomeLoss: L("Profit from the main business (operating income)", "What the everyday business earned after all its regular costs, before interest and tax."),
  // ---- below operating income
  NonoperatingIncomeExpense: L("Other income and costs", "Money made or lost outside the main business: interest earned on savings, interest paid on debt, investment gains and losses."),
  OtherNonoperatingIncomeExpense: L("Other income and costs", "Smaller gains and losses outside the main business."),
  InterestExpense: L("Interest paid on debt", "The cost of borrowing money."),
  InterestExpenseNonoperating: L("Interest paid on debt", "The cost of borrowing money."),
  InterestExpenseDebt: L("Interest paid on debt", "The cost of borrowing money."),
  InvestmentIncomeInterest: L("Interest earned", "Interest on its cash and investments."),
  InvestmentIncomeInterestAndDividend: L("Interest and dividends earned", "Income from its cash and investments."),
  InterestIncomeExpenseNonoperatingNet: L("Interest earned minus interest paid", "Interest on savings minus interest on debt."),
  GainLossOnInvestments: L("Gains or losses on investments", "Profit or loss from investments it sold or that changed in value."),
  IncomeLossFromEquityMethodInvestments: L("Share of profit from part-owned businesses", "Its slice of the profit (or loss) of companies it partly owns."),
  IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest: L("Profit before tax", "Profit after every cost and interest, before income tax."),
  IncomeLossFromContinuingOperationsBeforeIncomeTaxesMinorityInterestAndIncomeLossFromEquityMethodInvestments: L("Profit before tax", "Profit after every cost and interest, before income tax."),
  IncomeLossFromContinuingOperationsBeforeIncomeTaxesDomestic: L("Profit before tax in the US", "Profit before tax from its US business."),
  IncomeTaxExpenseBenefit: L("Income tax", "Tax on this period's profit. A negative number means a tax credit."),
  IncomeLossFromContinuingOperations: L("Profit from businesses it is keeping", "Profit from the parts of the business it is continuing with."),
  IncomeLossFromDiscontinuedOperationsNetOfTax: L("Profit or loss from businesses being sold or closed", "Results of parts it has sold or is closing, kept apart so the rest is easier to judge."),
  NetIncomeLoss: L("Profit (net income)", "What is left for shareholders after every cost, interest and tax. A negative number is a loss."),
  ProfitLoss: L("Profit, including partners' share", "Total profit, counting the slice that belongs to partners in businesses it doesn't fully own."),
  NetIncomeLossAttributableToNoncontrollingInterest: L("Profit belonging to partners (non-controlling interest)", "The slice of profit owned by partners in businesses it doesn't fully own."),
  NetIncomeLossAvailableToCommonStockholdersBasic: L("Profit for ordinary shareholders", "Profit after paying holders of preferred shares their share."),
  PreferredStockDividendsAndOtherAdjustments: L("Paid to preferred shareholders", "Dividends owed to holders of preferred shares, who are paid before ordinary shareholders."),
  EarningsPerShareBasic: L("Profit per share (basic EPS)", "Profit divided by the average number of shares that existed."),
  EarningsPerShareDiluted: L("Profit per share, counting promised shares (diluted EPS)", "Profit per share if every stock option and share award turned into a share. Usually a little lower than basic."),
  EarningsPerShareBasicAndDiluted: L("Profit per share (EPS)", "Profit divided by the average number of shares."),
  WeightedAverageNumberOfSharesOutstandingBasic: L("Average number of shares", "How many shares existed on average during the period."),
  WeightedAverageNumberOfDilutedSharesOutstanding: L("Average number of shares, counting promised shares", "Shares on average, plus those that could be created from options and share awards."),
  CommonStockDividendsPerShareDeclared: L("Dividend per share", "Cash promised to shareholders for each share they own."),
  CommonStockDividendsPerShareCashPaid: L("Dividend paid per share", "Cash paid to shareholders for each share they own."),
  // ---- banks
  InterestAndDividendIncomeOperating: L("Interest earned on loans and investments", "A bank's main income: interest from the loans it makes and the bonds it holds."),
  InterestExpenseOperating: L("Interest paid to savers and lenders", "What the bank pays on deposits and its own borrowing."),
  InterestIncomeExpenseNet: L("Interest earned minus interest paid (net interest income)", "A bank's main profit engine: interest from loans minus interest paid on deposits."),
  NoninterestIncome: L("Fees and other income (non-interest income)", "Income that isn't interest: fees, trading, advice, card charges."),
  NoninterestExpense: L("Running costs (non-interest expense)", "Staff, buildings, technology and other costs of running the bank."),
  ProvisionForLoanLeaseAndOtherLosses: L("Set aside for loans that may not be repaid", "Money put aside this period for loans expected to go bad."),
  ProvisionForLoanAndLeaseLosses: L("Set aside for loans that may not be repaid", "Money put aside this period for loans expected to go bad."),
  ProvisionForCreditLosses: L("Set aside for loans that may not be repaid", "Money put aside this period for loans expected to go bad."),
  ProvisionForDoubtfulAccounts: L("Set aside for customers who may not pay", "An estimate of money owed that won't be collected."),
  LaborAndRelatedExpense: L("Staff pay and benefits", "Wages, bonuses and benefits for employees."),
  InvestmentBankingRevenue: L("Fees for deals and share or bond sales (investment banking)", "Fees for advising on takeovers and helping companies raise money."),
  PrincipalTransactionsRevenue: L("Trading gains", "Profit from buying and selling shares, bonds and other investments for customers and itself."),
  // ---- comprehensive income
  OtherComprehensiveIncomeLossNetOfTax: L("Other gains and losses not in profit (other comprehensive income)", "Gains and losses that bypass profit, such as currency moves and value changes on unsold investments."),
  OtherComprehensiveIncomeLossNetOfTaxPortionAttributableToParent: L("Other gains and losses not in profit (other comprehensive income)", "Gains and losses that bypass profit, such as currency moves and value changes on unsold investments."),
  ComprehensiveIncomeNetOfTax: L("Profit plus other gains and losses (comprehensive income)", "Profit plus the gains and losses that bypass it."),
  OtherComprehensiveIncomeForeignCurrencyTransactionAndTranslationAdjustmentNetOfTax: L("Effect of currency moves on overseas businesses", "How exchange rates changed the dollar value of its businesses abroad."),
  OtherComprehensiveIncomeLossForeignCurrencyTransactionAndTranslationAdjustmentNetOfTax: L("Effect of currency moves on overseas businesses", "How exchange rates changed the dollar value of its businesses abroad."),
  OtherComprehensiveIncomeUnrealizedHoldingGainLossOnSecuritiesArisingDuringPeriodNetOfTax: L("Value changes on investments not yet sold", "Rises or falls in the value of bonds and similar investments it still holds."),
  OtherComprehensiveIncomeLossAvailableForSaleSecuritiesAdjustmentNetOfTax: L("Value changes on investments not yet sold", "Rises or falls in the value of bonds and similar investments it still holds."),
  OtherComprehensiveIncomeLossDerivativesQualifyingAsHedgesNetOfTax: L("Gains and losses on hedges", "Value changes on contracts that protect it against moves in currencies or interest rates."),
  OtherComprehensiveIncomeLossPensionAndOtherPostretirementBenefitPlansAdjustmentNetOfTax: L("Pension plan adjustments", "Changes in the expected cost of pensions it has promised."),

  // ---------------------------------------------------------------- balance sheet: assets
  CashAndCashEquivalentsAtCarryingValue: L("Cash", "Money in the bank and very safe investments that can be turned into cash within about three months."),
  Cash: L("Cash", "Money in the bank."),
  CashAndDueFromBanks: L("Cash, including cash held at other banks", "Money the bank holds itself or at other banks."),
  InterestBearingDepositsInBanks: L("Deposits at other banks and central banks", "Money it keeps at other banks, earning interest."),
  RestrictedCashAndCashEquivalentsAtCarryingValue: L("Cash set aside for specific uses", "Cash it can't freely spend, such as money held as a guarantee."),
  MarketableSecuritiesCurrent: L("Short-term investments", "Investments like government bonds that it can sell quickly, within a year."),
  ShortTermInvestments: L("Short-term investments", "Investments it can turn into cash within a year."),
  AvailableForSaleSecuritiesDebtSecuritiesCurrent: L("Short-term investments in bonds", "Bonds it can sell within a year."),
  MarketableSecuritiesNoncurrent: L("Long-term investments", "Bonds and other investments it plans to hold for more than a year."),
  LongTermInvestments: L("Long-term investments", "Investments it plans to hold for more than a year."),
  AccountsReceivableNetCurrent: L("Money customers owe it (accounts receivable)", "Sales already made but not yet paid for."),
  AccountsNotesAndLoansReceivableNetCurrent: L("Money owed to it", "Sales and loans not yet paid back."),
  ReceivablesNetCurrent: L("Money owed to it (receivables)", "Amounts due from customers and others, expected within a year."),
  NontradeReceivablesCurrent: L("Other money owed to it", "Money owed by others than customers, such as suppliers buying parts from it."),
  OtherReceivablesNetCurrent: L("Other money owed to it", "Money owed by others than customers."),
  InventoryNet: L("Stock on hand (inventory)", "Products, parts and materials waiting to be sold or used."),
  PrepaidExpenseCurrent: L("Bills paid in advance (prepaid expenses)", "Things paid for before they are used, like insurance or rent."),
  OtherAssetsCurrent: L("Other short-term assets", "Smaller things it owns that should turn into cash within a year."),
  PrepaidExpenseAndOtherAssetsCurrent: L("Prepaid and other short-term assets", "Bills paid in advance and other smaller short-term items."),
  AssetsCurrent: L("Total short-term assets (current assets)", "Everything it owns that should turn into cash within a year."),
  PropertyPlantAndEquipmentNet: L("Buildings and equipment (property, plant and equipment)", "Land, buildings, machines, computers and stores it owns, after wear and tear."),
  PropertyPlantAndEquipmentAndFinanceLeaseRightOfUseAssetAfterAccumulatedDepreciationAndAmortization: L("Buildings and equipment (property, plant and equipment)", "Land, buildings, machines and equipment it owns or leases long-term, after wear and tear."),
  OperatingLeaseRightOfUseAsset: L("Right to use rented property (lease assets)", "The value of offices, stores and equipment it rents on long leases."),
  Goodwill: L("Goodwill", "The extra it paid when buying other companies, above the value of their assets: for their name, customers and know-how."),
  IntangibleAssetsNetExcludingGoodwill: L("Patents, brands and other intangibles", "Valuable things you can't touch, like patents, trademarks and customer lists, mostly from businesses it bought."),
  FiniteLivedIntangibleAssetsNet: L("Patents, customer lists and other intangibles", "Intangibles that wear out over time, mostly from businesses it bought."),
  IndefiniteLivedIntangibleAssetsExcludingGoodwill: L("Brands and other lasting intangibles", "Intangibles expected to keep their value, such as famous brand names."),
  DeferredIncomeTaxAssetsNet: L("Tax savings to use later (deferred tax assets)", "Tax it has effectively prepaid or can save in future years."),
  DeferredTaxAssetsNet: L("Tax savings to use later (deferred tax assets)", "Tax it has effectively prepaid or can save in future years."),
  OtherAssetsNoncurrent: L("Other long-term assets", "Smaller things it owns for more than a year."),
  AssetsNoncurrent: L("Total long-term assets (non-current assets)", "Everything it owns that won't turn into cash within a year."),
  Assets: L("Total of everything it owns (total assets)", "Every asset added up: cash, investments, money owed to it, stock, buildings and more."),
  // ---- banks
  LoansAndLeasesReceivableNetReportedAmount: L("Loans it has made, after expected losses", "Money lent to people and businesses, minus what it expects won't be repaid."),
  LoansAndLeasesReceivableNetOfDeferredIncome: L("Loans it has made", "Money lent to people and businesses."),
  FinancingReceivableExcludingAccruedInterestAfterAllowanceForCreditLoss: L("Loans it has made, after expected losses", "Money lent to people and businesses, minus what it expects won't be repaid."),
  FinancingReceivableAllowanceForCreditLossExcludingAccruedInterest: L("Set aside for loans that may not be repaid", "The cushion held against loans going bad. It is subtracted from the loans."),
  LoansAndLeasesReceivableAllowance: L("Set aside for loans that may not be repaid", "The cushion held against loans going bad. It is subtracted from the loans."),
  FederalFundsSoldAndSecuritiesPurchasedUnderAgreementsToResell: L("Short-term loans to other banks, backed by securities", "Overnight and short loans to other financial firms, secured by bonds."),
  SecuritiesBorrowed: L("Securities borrowed", "Shares and bonds borrowed from others, with cash given as security."),
  TradingSecurities: L("Investments held for trading", "Shares, bonds and other investments it buys and sells, often for customers."),
  AvailableForSaleSecuritiesDebtSecurities: L("Bonds it may sell (available for sale)", "Bonds it could sell before they are due, shown at today's value."),
  HeldToMaturitySecurities: L("Bonds held until they are repaid (held to maturity)", "Bonds it plans to keep until they pay back."),
  // ---- liabilities
  AccountsPayableCurrent: L("Bills owed to suppliers (accounts payable)", "Money it owes suppliers for things already received."),
  AccountsPayableAndAccruedLiabilitiesCurrent: L("Bills owed and costs built up", "Money owed to suppliers and costs used but not yet paid."),
  AccruedLiabilitiesCurrent: L("Costs built up but not yet paid (accrued liabilities)", "Costs it has used, such as wages or taxes, that it hasn't paid yet."),
  EmployeeRelatedLiabilitiesCurrent: L("Wages and benefits owed to staff", "Pay, bonuses and benefits earned but not yet paid."),
  OtherLiabilitiesCurrent: L("Other bills due within a year", "Smaller amounts it owes within a year."),
  ContractWithCustomerLiabilityCurrent: L("Money received for things not yet delivered (deferred revenue)", "Customers paid in advance; it becomes a sale once the product or service is delivered."),
  DeferredRevenueCurrent: L("Money received for things not yet delivered (deferred revenue)", "Customers paid in advance; it becomes a sale once the product or service is delivered."),
  ContractWithCustomerLiabilityNoncurrent: L("Money received for things delivered later (deferred revenue)", "Advance payments for products or services delivered after the next year."),
  CommercialPaper: L("Very short-term borrowing (commercial paper)", "IOUs sold to investors that are usually repaid within a few months."),
  ShortTermBorrowings: L("Short-term borrowing", "Money borrowed that must be repaid within a year."),
  LongTermDebtCurrent: L("Long-term debt due within a year", "The part of its long-term borrowing that must be repaid within the next year."),
  DebtCurrent: L("Debt due within a year", "Borrowing that must be repaid within the next year."),
  OperatingLeaseLiabilityCurrent: L("Rent due within a year on long leases", "Lease payments due in the next year."),
  TaxesPayableCurrent: L("Tax owed", "Tax it owes and hasn't paid yet."),
  AccruedIncomeTaxesCurrent: L("Income tax owed", "Income tax it owes and hasn't paid yet."),
  DividendsPayableCurrent: L("Dividends promised but not yet paid", "Dividends announced that will be paid soon."),
  LiabilitiesCurrent: L("Total bills due within a year (current liabilities)", "Everything it owes that must be paid within a year."),
  LongTermDebtNoncurrent: L("Long-term debt", "Money borrowed that is due after more than a year, such as bonds."),
  LongTermDebtAndCapitalLeaseObligations: L("Long-term debt", "Money borrowed that is due after more than a year, including long leases."),
  LongTermDebtAndCapitalLeaseObligationsCurrent: L("Long-term debt due within a year", "The part of its long-term borrowing due in the next year."),
  LongTermDebtAndCapitalLeaseObligationsIncludingCurrentMaturities: L("Debt, including the part due soon", "All long-term borrowing and long leases, including what is due within a year."),
  StockRedeemedOrCalledDuringPeriodValue: L("Preferred shares paid back (redeemed)", "Preferred shares it bought back at a set price."),
  PreferredStockIncludingAdditionalPaidInCapitalNetOfDiscount: L("Preferred shares", "Shares that get paid dividends before ordinary shares, usually with no vote."),
  OccupancyNet: L("Buildings and rent (occupancy)", "The cost of offices and branches: rent, upkeep and similar."),
  ProfessionalAndContractServicesExpense: L("Outside professionals and contractors", "Fees for lawyers, consultants and other outside help."),
  CommunicationsAndInformationTechnology: L("Technology and communications", "Computers, software, data and phone costs."),
  OtherNoninterestExpense: L("Other running costs", "Smaller running costs not listed separately."),
  NoninterestIncomeOther: L("Other income", "Smaller income not listed separately."),
  InterestIncomeOperating: L("Interest earned on loans and investments", "A bank's main income: interest from the loans it makes and the bonds it holds."),
  CryptoAssetFairValueNoncurrent: L("Digital assets (crypto)", "Cryptocurrencies it holds, such as bitcoin, at today's value."),
  OtherAssets: L("Other assets", "Smaller things it owns."),
  OtherLiabilities: L("Other liabilities", "Smaller amounts it owes."),
  BeneficialInterest: L("Investments sold to others from its own funds (VIE interests)", "Shares of special funds it runs that it has sold to outside investors. It owes them their share."),
  IncreaseDecreaseInOperatingCapital: L("Change in short-term assets and bills", "Money tied up in, or freed from, stock, money owed to it and bills it owes."),
  IncreaseDecreaseInOtherNoncurrentLiabilities: L("Change in other long-term obligations", "A plus means it held on to cash longer."),
  DebtSecuritiesAvailableForSaleExcludingAccruedInterest: L("Bonds it may sell (available for sale)", "Bonds it could sell before they are due, shown at today's value."),
  DebtSecuritiesHeldToMaturityExcludingAccruedInterestAfterAllowanceForCreditLoss: L("Bonds held until they are repaid (held to maturity)", "Bonds it plans to keep until they pay back."),
  AccountsPayableAndAccruedLiabilitiesCurrentAndNoncurrent: L("Bills owed and other liabilities", "Money owed to suppliers and costs used but not yet paid."),
  LongTermDebt: L("Debt", "All borrowing that runs longer than a year, including the part due soon."),
  OperatingLeaseLiabilityNoncurrent: L("Rent owed on long leases", "Lease payments due after the next year."),
  DeferredIncomeTaxLiabilitiesNet: L("Tax owed later (deferred tax liabilities)", "Tax it will have to pay in future years on profits already counted."),
  AccruedIncomeTaxesNoncurrent: L("Income tax owed later", "Income tax it owes but will pay after the next year."),
  OtherLiabilitiesNoncurrent: L("Other long-term obligations", "Smaller amounts it owes after the next year."),
  LiabilitiesNoncurrent: L("Total long-term obligations (non-current liabilities)", "Everything it owes that is due after a year."),
  Liabilities: L("Total of everything it owes (total liabilities)", "Every debt and bill added up."),
  CommitmentsAndContingencies: L("Promises and possible costs", "A pointer to the notes, which describe contracts it has signed and lawsuits it may lose. No amount is shown here."),
  Deposits: L("Customers' deposits", "Money customers keep at the bank. The bank owes it back to them."),
  SecuritiesSoldUnderAgreementsToRepurchase: L("Short-term borrowing backed by securities (repos)", "Cash borrowed for a short time, with bonds given as security."),
  FederalFundsPurchasedAndSecuritiesSoldUnderAgreementsToRepurchase: L("Short-term borrowing backed by securities (repos)", "Cash borrowed for a short time from other banks, often with bonds as security."),
  TradingLiabilities: L("Trading obligations", "Amounts owed from its trading, such as shares it has sold but not yet bought."),
  // ---- equity
  CommonStockValue: L("Shares at their face value (common stock)", "A small legal value per share. Most of what investors paid sits in the next line."),
  AdditionalPaidInCapital: L("Money shareholders paid in (additional paid-in capital)", "What investors paid for shares above their face value, plus shares given as pay."),
  AdditionalPaidInCapitalCommonStock: L("Money shareholders paid in (additional paid-in capital)", "What investors paid for shares above their face value, plus shares given as pay."),
  CommonStocksIncludingAdditionalPaidInCapital: L("Money shareholders paid in (share capital)", "What investors paid the company for its shares over the years, plus shares given to staff as pay."),
  PreferredStockValue: L("Preferred shares", "Shares that get paid dividends before ordinary shares, usually with no vote."),
  RetainedEarningsAccumulatedDeficit: L("Profit kept in the business (retained earnings)", "All the profit made over the years, minus dividends and, for some companies, buybacks. Negative means more has been paid out or lost than earned."),
  TreasuryStockValue: L("Shares it bought back and holds (treasury stock)", "The cost of its own shares bought back and kept. It is subtracted from equity."),
  TreasuryStockCommonValue: L("Shares it bought back and holds (treasury stock)", "The cost of its own shares bought back and kept. It is subtracted from equity."),
  AccumulatedOtherComprehensiveIncomeLossNetOfTax: L("Built-up gains and losses not in profit (AOCI)", "The running total of gains and losses that bypass profit, such as currency moves and value changes on unsold investments."),
  StockholdersEquity: L("Shareholders' equity", "What would be left for shareholders if everything it owns paid off everything it owes, at the values in its books."),
  MinorityInterest: L("Partners' share (non-controlling interest)", "The part of businesses it controls but doesn't fully own that belongs to other investors."),
  StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest: L("Total equity, including partners' share", "Shareholders' equity plus the part owned by partners in businesses it doesn't fully own."),
  LiabilitiesAndStockholdersEquity: L("Total owed plus shareholders' equity", "Always equals total assets: everything it owns was paid for either by what it owes or by its shareholders."),
  CommonStockSharesOutstanding: L("Shares in existence", "How many shares are owned by investors."),
  CommonStockSharesIssued: L("Shares issued", "How many shares it has ever handed out, before any it holds itself."),

  // ---------------------------------------------------------------- cash flow statement
  ShareBasedCompensation: L("Pay given in shares (stock-based compensation)", "Staff pay given as shares. It lowered profit but used no cash, so it's added back here."),
  AllocatedShareBasedCompensationExpense: L("Pay given in shares (stock-based compensation)", "Staff pay given as shares. It lowered profit but used no cash, so it's added back here."),
  DeferredIncomeTaxExpenseBenefit: L("Tax counted now, paid later (deferred tax)", "Part of this year's tax bill that won't be paid in cash yet, so it's added back."),
  OtherNoncashIncomeExpense: L("Other items that used no cash", "Smaller costs or gains in profit that didn't involve cash."),
  IncreaseDecreaseInAccountsReceivable: L("Change in money customers owe", "When customers owe more, cash arrives later, so it shows as a minus. When they pay down, it's a plus."),
  IncreaseDecreaseInOtherReceivables: L("Change in other money owed to it", "More owed to it means less cash now (a minus), and the reverse."),
  IncreaseDecreaseInInventories: L("Change in stock on hand", "Building up stock ties up cash (a minus); selling it down frees cash (a plus)."),
  IncreaseDecreaseInAccountsPayable: L("Change in bills owed to suppliers", "Paying suppliers later keeps cash in the business longer (a plus), and the reverse."),
  IncreaseDecreaseInAccountsPayableTrade: L("Change in bills owed to suppliers", "Paying suppliers later keeps cash in the business longer (a plus), and the reverse."),
  IncreaseDecreaseInOtherOperatingAssets: L("Change in other short-term assets", "A minus means more cash tied up in them; a plus means cash freed up."),
  IncreaseDecreaseInOtherCurrentAssets: L("Change in other short-term assets", "A minus means more cash tied up in them; a plus means cash freed up."),
  IncreaseDecreaseInOtherOperatingLiabilities: L("Change in other short-term bills", "A plus means it held on to cash longer; a minus means it paid more out."),
  IncreaseDecreaseInOtherCurrentLiabilities: L("Change in other short-term bills", "A plus means it held on to cash longer; a minus means it paid more out."),
  IncreaseDecreaseInAccruedLiabilities: L("Change in costs not yet paid", "A plus means costs built up without cash leaving yet."),
  IncreaseDecreaseInContractWithCustomerLiability: L("Change in money received in advance", "More customer prepayments bring cash in early (a plus)."),
  IncreaseDecreaseInDeferredRevenue: L("Change in money received in advance", "More customer prepayments bring cash in early (a plus)."),
  IncreaseDecreaseInPrepaidDeferredExpenseAndOtherAssets: L("Change in prepaid and other assets", "Paying more in advance uses cash (a minus)."),
  IncreaseDecreaseInIncomeTaxes: L("Change in tax owed", "Owing more tax than it paid keeps cash in for now (a plus)."),
  IncreaseDecreaseInIncomeTaxesPayableNetOfIncomeTaxesReceivable: L("Change in tax owed", "Owing more tax than it paid keeps cash in for now (a plus)."),
  IncreaseDecreaseInEmployeeRelatedLiabilities: L("Change in wages owed to staff", "Pay earned but not yet paid keeps cash in for now (a plus)."),
  NetCashProvidedByUsedInOperatingActivities: L("Cash from the main business (operating cash flow)", "The cash the everyday business actually brought in, after paying its bills."),
  NetCashProvidedByUsedInOperatingActivitiesContinuingOperations: L("Cash from the main business (operating cash flow)", "The cash the everyday business actually brought in, after paying its bills."),
  PaymentsToAcquireAvailableForSaleSecuritiesDebt: L("Bought investments", "Cash spent buying bonds and similar investments."),
  PaymentsToAcquireMarketableSecurities: L("Bought investments", "Cash spent buying bonds, shares and similar investments."),
  PaymentsToAcquireInvestments: L("Bought investments", "Cash spent buying investments."),
  PaymentsToAcquireShortTermInvestments: L("Bought short-term investments", "Cash moved into investments it can sell within a year."),
  ProceedsFromMaturitiesPrepaymentsAndCallsOfAvailableForSaleSecurities: L("Investments that paid back", "Cash back from bonds that reached their end date."),
  ProceedsFromSaleOfAvailableForSaleSecuritiesDebt: L("Investments sold", "Cash from selling bonds before their end date."),
  ProceedsFromSaleMaturityAndCollectionsOfInvestments: L("Investments sold or paid back", "Cash from investments it sold or that reached their end date."),
  ProceedsFromSaleAndMaturityOfMarketableSecurities: L("Investments sold or paid back", "Cash from investments it sold or that reached their end date."),
  PaymentsToAcquirePropertyPlantAndEquipment: L("Spent on buildings and equipment (capital expenditure)", "Cash spent on long-lasting things like factories, data centres, stores and machines."),
  PaymentsToAcquireProductiveAssets: L("Spent on buildings, equipment and other long-term assets (capital expenditure)", "Cash spent on long-lasting things the business runs on."),
  ProceedsFromSaleOfPropertyPlantAndEquipment: L("Sold buildings or equipment", "Cash from selling long-lasting things it no longer needs."),
  PaymentsToAcquireBusinessesNetOfCashAcquired: L("Bought other businesses (acquisitions)", "Cash spent buying companies, minus the cash those companies already held."),
  PaymentsToAcquireIntangibleAssets: L("Bought patents, licences and other intangibles", "Cash spent on valuable things you can't touch."),
  PaymentsForProceedsFromOtherInvestingActivities: L("Other investing", "Smaller investment payments and receipts."),
  NetCashProvidedByUsedInInvestingActivities: L("Cash used for investing", "Overall cash spent on (or received from) investments, equipment and businesses. Usually a minus for a growing company."),
  NetCashProvidedByUsedInInvestingActivitiesContinuingOperations: L("Cash used for investing", "Overall cash spent on (or received from) investments, equipment and businesses."),
  PaymentsRelatedToTaxWithholdingForShareBasedCompensation: L("Tax paid for staff on their share pay", "When staff shares vest, the company keeps some of them and pays the staff's tax bill in cash."),
  PaymentsOfDividends: L("Dividends paid to shareholders", "Cash handed to shareholders as their share of profit."),
  PaymentsOfDividendsCommonStock: L("Dividends paid to shareholders", "Cash handed to shareholders as their share of profit."),
  PaymentsOfOrdinaryDividends: L("Dividends paid to shareholders", "Cash handed to shareholders as their share of profit."),
  PaymentsOfDividendsMinorityInterest: L("Dividends paid to partners", "Cash paid to partners in businesses it doesn't fully own."),
  PaymentsForRepurchaseOfCommonStock: L("Shares bought back (buybacks)", "Cash spent buying its own shares from the market, which leaves fewer shares for the same business."),
  PaymentsForRepurchaseOfEquity: L("Shares bought back (buybacks)", "Cash spent buying its own shares from the market."),
  ProceedsFromIssuanceOfLongTermDebt: L("New long-term borrowing", "Cash raised by borrowing, often by selling bonds."),
  ProceedsFromIssuanceOfSeniorLongTermDebt: L("New long-term borrowing", "Cash raised by borrowing, often by selling bonds."),
  ProceedsFromIssuanceOfDebt: L("New borrowing", "Cash raised by borrowing."),
  ProceedsFromDebtNetOfIssuanceCosts: L("New borrowing", "Cash raised by borrowing, after fees."),
  RepaymentsOfLongTermDebt: L("Debt paid back", "Cash used to repay borrowing."),
  RepaymentsOfDebt: L("Debt paid back", "Cash used to repay borrowing."),
  RepaymentsOfSeniorDebt: L("Debt paid back", "Cash used to repay borrowing."),
  ProceedsFromRepaymentsOfCommercialPaper: L("Change in very short-term borrowing (commercial paper)", "Short IOUs sold minus those repaid."),
  ProceedsFromRepaymentsOfShortTermDebt: L("Change in short-term borrowing", "Short-term loans taken minus those repaid."),
  ProceedsFromIssuanceOfCommonStock: L("New shares sold", "Cash raised by selling new shares."),
  ProceedsFromStockOptionsExercised: L("Cash from staff buying shares with options", "Staff paid the company to turn their options into shares."),
  ProceedsFromPaymentsForOtherFinancingActivities: L("Other financing", "Smaller payments to or from lenders and shareholders."),
  NetCashProvidedByUsedInFinancingActivities: L("Cash paid to or raised from lenders and shareholders (financing)", "Borrowing and new shares bring cash in; repaying debt, dividends and buybacks send it out."),
  NetCashProvidedByUsedInFinancingActivitiesContinuingOperations: L("Cash paid to or raised from lenders and shareholders (financing)", "Borrowing and new shares bring cash in; repaying debt, dividends and buybacks send it out."),
  EffectOfExchangeRateOnCashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents: L("Effect of currency moves on cash", "Cash held in other currencies is worth more or fewer dollars when exchange rates move."),
  EffectOfExchangeRateOnCashAndCashEquivalents: L("Effect of currency moves on cash", "Cash held in other currencies is worth more or fewer dollars when exchange rates move."),
  CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalentsPeriodIncreaseDecreaseIncludingExchangeRateEffect: L("Change in cash over the period", "All the cash that came in minus all that went out."),
  CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalentsPeriodIncreaseDecreaseExcludingExchangeRateEffect: L("Change in cash over the period", "All the cash that came in minus all that went out."),
  CashAndCashEquivalentsPeriodIncreaseDecrease: L("Change in cash over the period", "All the cash that came in minus all that went out."),
  CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents: L("Cash, including cash set aside", "Cash in the bank, very safe short investments, and cash held for specific uses."),
  IncomeTaxesPaidNet: L("Income tax actually paid in cash", "The tax cash that left the business, which can differ from the tax shown in the income statement."),
  IncomeTaxesPaid: L("Income tax actually paid in cash", "The tax cash that left the business."),
  InterestPaidNet: L("Interest actually paid in cash", "Cash paid as interest on its debt."),
  InterestPaid: L("Interest actually paid in cash", "Cash paid as interest on its debt."),
  NetIncreaseDecreaseInDeposits: L("Change in customers' deposits", "More deposits bring cash in for a bank."),
  IncreaseDecreaseInDeposits: L("Change in customers' deposits", "More deposits bring cash in for a bank."),

  // ---------------------------------------------------------------- statement of shareholders' equity
  StockIssuedDuringPeriodValueShareBasedCompensation: L("Shares given to staff", "New shares handed to employees as part of their pay."),
  StockIssuedDuringPeriodValueEmployeeStockOwnershipPlan: L("Shares sold to staff through a share plan", "Employees buying shares, often at a discount."),
  StockIssuedDuringPeriodValueStockOptionsExercised: L("Shares from staff options", "Shares created when staff used their options."),
  StockIssuedDuringPeriodValueNewIssues: L("New shares sold", "Shares sold to investors for cash."),
  StockIssuedDuringPeriodValueAcquisitions: L("Shares used to buy a business", "New shares given as payment for a company it bought."),
  AdjustmentsToAdditionalPaidInCapitalSharebasedCompensationRequisiteServicePeriodRecognitionValue: L("Pay given in shares (stock-based compensation)", "The value of share awards staff earned this period."),
  AdjustmentsToAdditionalPaidInCapitalSharebasedCompensationRequisiteServicePeriodRecognition: L("Pay given in shares (stock-based compensation)", "The value of share awards staff earned this period."),
  StockRepurchasedDuringPeriodValue: L("Shares bought back", "The cost of its own shares it bought back."),
  StockRepurchasedAndRetiredDuringPeriodValue: L("Shares bought back and cancelled", "The cost of its own shares it bought back and cancelled."),
  TreasuryStockValueAcquiredCostMethod: L("Shares bought back", "The cost of its own shares it bought back and holds."),
  TreasuryStockReissuedAtLowerThanRepurchasePrice: L("Bought-back shares handed out again", "Shares it held that were given out again, often to staff."),
  DividendsCommonStock: L("Dividends declared", "Profit promised to shareholders as dividends. It leaves the business, so equity falls."),
  DividendsCommonStockCash: L("Dividends declared", "Profit promised to shareholders as cash dividends."),
  Dividends: L("Dividends declared", "Profit promised to shareholders as dividends."),
  DividendsPreferredStockCash: L("Dividends to preferred shareholders", "Dividends owed to holders of preferred shares."),
  DividendsPreferredStock: L("Dividends to preferred shareholders", "Dividends owed to holders of preferred shares."),
  AdjustmentsRelatedToTaxWithholdingForShareBasedCompensation: L("Shares kept back to pay staff's tax", "Shares withheld from staff awards to cover their tax bill, which the company pays in cash."),
  MinorityInterestDecreaseFromDistributionsToNoncontrollingInterestHolders: L("Paid out to partners", "Cash paid to partners in businesses it doesn't fully own."),
};

type Rule = { test: RegExp; kinds?: StatementKind[]; info: LinePlain };
const R = (test: RegExp, plain: string, what: string, kinds?: StatementKind[]): Rule => ({ test, kinds, info: L(plain, what) });

/** Words in the company's label (and tag), checked in order: the first match wins. */
const BY_WORDS: Rule[] = [
  R(/beginning|start of (the )?(year|period)/i, "At the start", "The amount at the start of the period.", ["cashflow", "equity"]),
  R(/end of (the )?(year|period)|ending balance|\bend\b/i, "At the end", "The amount at the end of the period.", ["cashflow", "equity"]),
  R(/per (diluted )?share|eps/i, "Per share", "An amount for each single share."),
  R(/weighted|shares used in comput/i, "Average number of shares", "How many shares existed on average during the period."),
  R(/research|development/i, "Research and development", "Spending on inventing and improving products."),
  R(/marketing|advertis/i, "Marketing", "Money spent getting customers to notice and buy."),
  R(/selling|general and admin|g&a|sg&a/i, "Selling and running costs", "Sales staff, marketing, head office and other running costs."),
  R(/restructur|severance|exit cost/i, "Restructuring costs", "One-off costs of reorganising, such as job cuts or closing sites."),
  R(/impair|write[- ]?down|write[- ]?off/i, "Write-down (impairment)", "Lowering the recorded value of something it owns. No cash is spent."),
  R(/stock[- ]based|share[- ]based|equity[- ]based|stock compensation|share compensation|stock award/i, "Pay given in shares (stock-based compensation)", "Staff pay given as shares instead of cash."),
  R(/depreciation|amortization|amortisation/i, "Wear and tear (depreciation and amortization)", "The cost of long-lasting things spread over the years they're used. No cash is spent.", ["income", "cashflow", "comprehensive"]),
  R(/provision for (credit|loan)|credit loss|allowance for (loan|credit)/i, "Set aside for loans that may not be repaid", "A cushion for loans expected to go bad."),
  R(/income tax|provision for (income )?tax|tax (expense|provision|benefit)/i, "Income tax", "Tax on profit. A negative number is a credit."),
  R(/before (income )?tax|pre-?tax/i, "Profit before tax", "Profit after costs and interest, before tax."),
  R(/interest expense|interest paid|interest on/i, "Interest paid", "The cost of borrowing money."),
  R(/interest (and dividend )?income|interest earned/i, "Interest earned", "Interest on loans, savings or investments."),
  R(/other comprehensive|oci\b/i, "Other gains and losses not in profit (other comprehensive income)", "Gains and losses that bypass profit, such as currency moves and value changes on unsold investments."),
  R(/foreign currency|translation|exchange rate/i, "Effect of currency moves", "How exchange rates changed dollar values."),
  R(/hedg|derivative/i, "Hedges", "Contracts that protect it against moves in currencies, interest rates or prices."),
  R(/pension|postretirement|retirement benefit/i, "Pensions", "Retirement benefits it has promised staff."),
  R(/unrealized|unrealised/i, "Value changes not yet cashed in", "Rises or falls in value of things it still holds."),
  R(/equity method|affiliate|joint venture|equity income/i, "Share of profit from part-owned businesses", "Its slice of profit from companies it partly owns.", ["income", "cashflow"]),
  R(/equity method|affiliate|joint venture|equity investments?\b/i, "Investments in part-owned businesses", "Stakes in companies it partly owns, such as bottlers or joint ventures.", ["balance"]),
  R(/held for sale/i, "Assets it plans to sell", "Businesses or property it has agreed or decided to sell.", ["balance"]),
  R(/noncontrolling|non-controlling|minority/i, "Partners' share (non-controlling interest)", "The part owned by other investors in businesses it controls."),
  R(/discontinued/i, "Businesses being sold or closed", "Results of parts it has sold or is closing."),
  R(/gain|loss on (sale|disposal)|investment (gain|loss)/i, "Gains or losses", "Profit or loss on things it sold or that changed in value."),
  R(/net (income|earnings|loss)|net profit/i, "Profit (net income)", "What is left after every cost, interest and tax."),
  R(/operating (income|profit|loss)|income from operations|operating earnings/i, "Profit from the main business (operating income)", "What the everyday business earned before interest and tax."),
  R(/gross (profit|margin)/i, "Profit after making costs (gross profit)", "Sales minus the cost of making what was sold."),
  R(/cost of (sales|revenue|goods|products|services)|costs? of (net )?(sales|revenue)/i, "Cost of making what it sold", "What the products and services it sold cost to make or deliver."),
  R(/(net )?(sales|revenues?)\b/i, "Sales", "Money brought in from customers.", ["income", "comprehensive"]),
  R(/fees|commissions/i, "Fees", "Money charged for services."),
  // cash flow specifics
  R(/repurchase|buyback|buy back|treasury/i, "Shares bought back", "Its own shares bought back from investors."),
  R(/dividend/i, "Dividends", "Profit handed to shareholders."),
  R(/capital expenditure|purchases? of property|additions to property|payments for (acquisition of )?property|purchases? of (plant|equipment)/i, "Spent on buildings and equipment (capital expenditure)", "Cash spent on long-lasting things the business runs on."),
  R(/acqui(sition|red)|purchase of business|business combination/i, "Buying other businesses", "Cash or shares used to buy companies."),
  R(/purchases? of (marketable|investments|securities|debt)|payments for (acquisition of )?(marketable|investments|securities)/i, "Bought investments", "Cash moved into bonds, shares or similar investments.", ["cashflow"]),
  R(/(proceeds|maturities|sales) (from|of) (marketable|investments|securities)|maturities of (marketable|investments|securities)/i, "Investments sold or paid back", "Cash back from investments.", ["cashflow"]),
  R(/current maturities|current portion of (long-term )?debt|due within one year/i, "Debt due within a year", "Borrowing that must be repaid within the next year.", ["balance"]),
  R(/loans and notes payable|notes payable|short-term borrowings?/i, "Short-term borrowing", "Money borrowed that must be repaid within a year.", ["balance"]),
  R(/proceeds from (issuance of )?(long-term )?(debt|borrowing|notes|bonds|term debt)|issuance of (debt|notes|term debt)/i, "New borrowing", "Cash raised by borrowing."),
  R(/repayments? of|payments? (of|on) (debt|borrowing|notes|term debt)|retirement of debt/i, "Debt paid back", "Cash used to repay borrowing.", ["cashflow"]),
  R(/commercial paper/i, "Very short-term borrowing (commercial paper)", "IOUs that are repaid within a few months."),
  R(/issuance of (common )?stock|proceeds from (stock|shares|employee stock)|stock option/i, "New shares", "Cash from issuing shares."),
  R(/tax(es)? (paid|withheld)|withholding/i, "Tax paid for staff on share pay", "Shares kept back to cover staff tax, paid by the company in cash."),
  R(/receivable/i, "Money owed to it (receivables)", "Amounts others owe it and haven't paid yet."),
  R(/inventor/i, "Stock on hand (inventory)", "Products and materials waiting to be sold or used."),
  R(/prepaid/i, "Paid in advance (prepaid)", "Things paid for before they are used."),
  R(/payable/i, "Bills owed (payables)", "Money it owes and hasn't paid yet."),
  R(/accrued/i, "Costs built up but not yet paid (accrued)", "Costs used that haven't been paid yet."),
  R(/deferred revenue|unearned|contract liabilit|customer deposits|advance(s)? from customers/i, "Money received for things not yet delivered", "Customers paid in advance; it becomes a sale on delivery."),
  R(/deferred (income )?tax/i, "Tax timing differences (deferred tax)", "Tax to be paid or saved in future years."),
  R(/goodwill/i, "Goodwill", "The extra paid for businesses it bought, above the value of their assets."),
  R(/intangible|patent|trademark|brand|licen[cs]e/i, "Intangibles", "Valuable things you can't touch, such as patents and brands."),
  R(/property|plant|equipment|buildings?|land\b/i, "Buildings and equipment", "Long-lasting physical things it owns."),
  R(/trading assets/i, "Investments held for trading", "Shares, bonds and other investments it buys and sells, often for customers."),
  R(/trading liabilities/i, "Trading obligations", "Amounts owed from its trading."),
  R(/marketable|investments?|securities/i, "Investments", "Bonds, shares and similar investments."),
  R(/cash/i, "Cash", "Money in the bank and very safe short investments."),
  R(/deposit/i, "Deposits", "Money customers keep with it, or it keeps elsewhere."),
  R(/loans?\b/i, "Loans", "Money lent out (for a bank) or borrowed."),
  R(/debt|borrowing|notes|bonds|term loan|credit facility|debentures/i, "Debt", "Money it has borrowed."),
  R(/lease/i, "Leases", "Property and equipment it rents on long contracts."),
  R(/retained earnings|accumulated deficit|reinvested/i, "Profit kept in the business (retained earnings)", "Profit made over the years, minus what was paid out."),
  R(/paid-in|paid in|common stock|capital stock|share capital|ordinary shares/i, "Money shareholders paid in (share capital)", "What investors paid for shares, plus shares given as pay."),
  R(/total (stockholders|shareholders|shareowners)['’]? (equity|deficit)/i, "Shareholders' equity", "Owned minus owed, at book values."),
  R(/total liabilities and/i, "Total owed plus shareholders' equity", "Always equals total assets."),
  R(/total current assets/i, "Total short-term assets", "Things it owns that should turn into cash within a year."),
  R(/total current liabilities/i, "Total bills due within a year", "Everything it owes within a year."),
  R(/total assets/i, "Total of everything it owns", "Every asset added up."),
  R(/total liabilities/i, "Total of everything it owes", "Every debt and bill added up."),
  R(/contingenc|commitments/i, "Promises and possible costs", "A pointer to the notes on contracts and possible legal costs."),
  R(/warrant/i, "Warrants", "Rights to buy shares at a set price."),
  R(/preferred/i, "Preferred shares", "Shares paid before ordinary shares, usually with no vote."),
];

/** What a line is, from where it sits, when neither its tag nor its words say. */
const BY_SECTION: Record<Section, LinePlain> = {
  currentAssets: L("Other short-term asset", "Something it owns that should turn into cash within a year."),
  assets: L("Other long-term asset", "Something it owns that it expects to keep for more than a year."),
  currentLiabilities: L("Other bill due within a year", "Something it owes that must be paid within a year."),
  liabilities: L("Other long-term obligation", "Something it owes that is due after more than a year."),
  equity: L("Part of shareholders' equity", "A part of what belongs to shareholders."),
  operating: L("Other item in cash from the business", "An adjustment between profit and the cash the business brought in. A minus means cash went out."),
  investing: L("Other investing item", "Cash spent on, or received from, investments and long-term assets. A minus means cash went out."),
  financing: L("Other financing item", "Cash paid to, or raised from, lenders and shareholders. A minus means cash went out."),
  supplemental: L("Extra detail", "Extra information the company gives alongside the cash flow statement."),
  none: L("Other item", "A line the company shows in this statement. The notes in its report explain it."),
};

/** "us-gaap_NetIncomeLoss" -> "NetIncomeLoss"; company-made tags ("aapl_...") return "". */
export function standardTag(concept: string): string {
  const m = concept.match(/^(us-gaap|ifrs-full|dei|srt)_(.+)$/);
  return m ? m[2] : "";
}

export function plainLine(concept: string, label: string, kind: StatementKind, section: Section): LinePlain & { how: "tag" | "words" | "place" } {
  const tag = standardTag(concept);
  const byTag = tag ? BY_TAG[tag] : undefined;
  if (byTag) {
    // The cash line in a cash flow statement appears twice: at the start and at the end.
    if (kind === "cashflow" && /CashCashEquivalents|CashAndCashEquivalentsAtCarryingValue/.test(tag) && !/Period|Effect/.test(tag)) {
      if (/begin|start/i.test(label)) return { plain: "Cash at the start", what: "The cash it had when the period began.", how: "tag" };
      if (/end/i.test(label)) return { plain: "Cash at the end", what: "The cash it had when the period finished.", how: "tag" };
    }
    if (kind === "equity" && /StockholdersEquity|^MinorityInterest$/.test(tag)) {
      if (/begin|start|balance at|balances? at/i.test(label) && !/end/i.test(label)) return { plain: "At the start", what: "The amount when the period began.", how: "tag" };
      if (/end/i.test(label)) return { plain: "At the end", what: "The amount when the period finished.", how: "tag" };
    }
    return { ...byTag, how: "tag" };
  }
  // The company's own words first, then the words inside its tag.
  const tagWords = concept.replace(/^[a-z-]+_/, "").replace(/([a-z])([A-Z])/g, "$1 $2");
  for (const words of [label, tagWords]) {
    for (const rule of BY_WORDS) {
      if (rule.kinds && !rule.kinds.includes(kind)) continue;
      if (rule.test.test(words)) return { ...rule.info, how: "words" };
    }
  }
  return { ...BY_SECTION[section], how: "place" };
}

/** Follow the headings down a statement to know which part each line is in. */
export function sectionAfter(previous: Section, label: string, kind: StatementKind): Section {
  const t = label.toLowerCase();
  if (kind === "balance") {
    if (/current assets/.test(t) && !/total|non-?current/.test(t)) return "currentAssets";
    if (/total current assets/.test(t)) return "assets";
    if (/^assets\b|non-?current assets|long-term assets/.test(t)) return /current assets/.test(t) && !/non/.test(t) ? "currentAssets" : "assets";
    if (/current liabilities/.test(t) && !/total|non-?current/.test(t)) return "currentLiabilities";
    if (/total current liabilities/.test(t)) return "liabilities";
    if (/liabilities/.test(t) && !/total liabilities and|and (stockholders|shareholders)/.test(t) && previous !== "currentLiabilities") return /^total/.test(t) ? previous : "liabilities";
    if (/equity|stockholders|shareholders|shareowners/.test(t) && !/total liabilities and/.test(t)) return "equity";
  }
  if (kind === "cashflow") {
    if (/operating activities|operations:|operating:/.test(t)) return "operating";
    if (/investing activities|investing:/.test(t)) return "investing";
    if (/financing activities|financing:/.test(t)) return "financing";
    if (/supplemental|cash paid|non-?cash/.test(t)) return "supplemental";
  }
  return previous;
}
