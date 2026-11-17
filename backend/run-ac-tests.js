const BASE_URL = 'http://localhost:3001/api/v1';

async function request(url, options = {}) {
  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
  const res = await fetch(fullUrl, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

async function runTestSuite() {
  console.log('===============================================================');
  console.log('   DUROZEN ACCOUNTS — ACCEPTANCE CRITERIA VERIFICATION SUITE   ');
  console.log('===============================================================\n');

  let passed = 0;
  let total = 0;

  function test(name, pass, details = '') {
    total++;
    if (pass) {
      passed++;
      console.log(`✅ [PASS] ${name}${details ? ' - ' + details : ''}`);
    } else {
      console.error(`❌ [FAIL] ${name}${details ? ' - ' + details : ''}`);
    }
  }

  // 1. Auth & RBAC Tests
  let ceoToken = '';
  let accountantToken = '';

  try {
    const ceoLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@durozen.com', password: 'Admin@123' }),
    });
    ceoToken = ceoLogin.data?.data?.access_token;
    test('AC-01: CEO Authentication', ceoLogin.ok && !!ceoToken && ceoLogin.data?.data?.user?.role === 'CEO');
  } catch (err) {
    test('AC-01: CEO Authentication', false, err.message);
  }

  try {
    const acctLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'accountant@durozen.com', password: 'Accountant@123' }),
    });
    accountantToken = acctLogin.data?.data?.access_token;
    test('AC-02: Accountant Authentication', acctLogin.ok && !!accountantToken && acctLogin.data?.data?.user?.role === 'ACCOUNTANT');
  } catch (err) {
    test('AC-02: Accountant Authentication', false, err.message);
  }

  try {
    const badLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@durozen.com', password: 'WrongPassword!' }),
    });
    test('AC-02b: Invalid Password Rejection', badLogin.status === 401);
  } catch (err) {
    test('AC-02b: Invalid Password Rejection', false, err.message);
  }

  // AC-03: RBAC Enforcement - Accountant cannot update company settings
  try {
    const forbiddenRes = await request('/company/settings', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${accountantToken}` },
      body: JSON.stringify({ company_name: 'Hacked Name' }),
    });
    test('AC-03: RBAC Setting Mutation Guard', forbiddenRes.status === 403, 'Accountant received 403 Forbidden');
  } catch (err) {
    test('AC-03: RBAC Setting Mutation Guard', false, err.message);
  }

  const ceoHeaders = { Authorization: `Bearer ${ceoToken}` };

  // Fetch initial master data
  const [custRes, vendRes, bankRes, empRes] = await Promise.all([
    request('/customers', { headers: ceoHeaders }),
    request('/vendors', { headers: ceoHeaders }),
    request('/cash-bank/accounts', { headers: ceoHeaders }),
    request('/employees', { headers: ceoHeaders }),
  ]);

  const customer = custRes.data?.data?.[0];
  const vendor = vendRes.data?.data?.[0];
  const hdfcBank = bankRes.data?.data?.find(b => b.account_type === 'CURRENT_ACCOUNT') || bankRes.data?.data?.[0];
  const cashAccount = bankRes.data?.data?.find(b => b.account_type === 'CASH') || bankRes.data?.data?.[1];
  const employee = empRes.data?.data?.[0];

  test('Master Data Verification', !!customer && !!vendor && !!hdfcBank && !!employee, 
    `Cust: ${customer?.name}, Bank: ${hdfcBank?.account_name}, Cash: ${cashAccount?.account_name}`);

  // AC-06 & AC-07: Invoicing & Double Entry
  let invoiceId = '';
  let invoiceTotal = 0;
  try {
    const invRes = await request('/invoices', {
      method: 'POST',
      headers: ceoHeaders,
      body: JSON.stringify({
        customer_id: customer.id,
        invoice_date: '2026-05-15',
        due_date: '2026-06-15',
        is_interstate: false,
        items: [
          {
            description: 'Enterprise Cloud Consulting',
            hsn_sac: '998313',
            quantity: 1,
            unit_price: 100000,
            discount_percent: 0,
            tax_rate: 18,
          }
        ]
      }),
    });
    const draftInvoice = invRes.data?.data;
    invoiceId = draftInvoice?.id;
    invoiceTotal = Number(draftInvoice?.total_amount);

    test('AC-06: Draft Invoice Creation', draftInvoice?.status === 'DRAFT' && invoiceTotal === 118000, 
      `Total: ₹${invoiceTotal} (Taxable: ₹1,00,000 + CGST 9% + SGST 9%)`);

    // Post Invoice
    const postRes = await request(`/invoices/${invoiceId}/post`, {
      method: 'POST',
      headers: ceoHeaders,
    });
    const postedInvoice = postRes.data?.data;
    test('AC-07: Invoice Posting & Statutory Numbering', 
      postedInvoice?.status === 'POSTED' && postedInvoice?.invoice_number?.startsWith('DZT/INV/'),
      `Number: ${postedInvoice?.invoice_number}`);
  } catch (err) {
    test('AC-06 & AC-07: Invoicing', false, err.message);
  }

  // AC-08: Partial Customer Payment Receipt
  try {
    const recRes = await request('/receipts', {
      method: 'POST',
      headers: ceoHeaders,
      body: JSON.stringify({
        customer_id: customer.id,
        payment_date: '2026-05-20',
        amount: 60000,
        payment_mode: 'BANK_TRANSFER',
        receiving_account_id: hdfcBank.id,
        reference_number: 'NEFT-88992211',
        remarks: 'Partial payment against consulting invoice',
        allocations: [
          {
            invoice_id: invoiceId,
            allocated_amount: 60000,
          }
        ]
      }),
    });
    const receipt = recRes.data?.data;

    const updatedInvRes = await request(`/invoices/${invoiceId}`, { headers: ceoHeaders });
    const updatedInv = updatedInvRes.data?.data;

    test('AC-08: Customer Receipt & Invoice Allocation',
      receipt?.status === 'POSTED' && 
      Number(updatedInv?.amount_paid) === 60000 && 
      Number(updatedInv?.balance_due) === 58000 &&
      updatedInv?.status === 'PARTIALLY_PAID',
      `Paid: ₹${updatedInv?.amount_paid}, Balance Due: ₹${updatedInv?.balance_due}`);
  } catch (err) {
    test('AC-08: Customer Receipt & Allocation', false, err.message);
  }

  // AC-10 & AC-11: Vendor Bill Recording and Payment
  let billId = '';
  try {
    const billNumber = `VB-${Date.now().toString().slice(-6)}`;
    const billRes = await request('/vendor-bills', {
      method: 'POST',
      headers: ceoHeaders,
      body: JSON.stringify({
        vendor_id: vendor.id,
        vendor_bill_number: billNumber,
        bill_date: '2026-05-18',
        due_date: '2026-06-18',
        is_interstate: false,
        items: [
          {
            description: 'Office Server Hardware',
            hsn_sac: '8471',
            quantity: 1,
            unit_price: 50000,
            discount_percent: 0,
            tax_rate: 18,
          }
        ]
      }),
    });
    billId = billRes.data?.data?.id;
    const bill = billRes.data?.data;

    test('AC-10: Vendor Bill Creation & Double Entry',
      bill?.status === 'POSTED' && Number(bill?.total_amount) === 59000,
      `Bill: ${bill?.bill_number}, Total: ₹${bill?.total_amount}`);

    // Duplicate vendor bill number check
    const dupRes = await request('/vendor-bills', {
      method: 'POST',
      headers: ceoHeaders,
      body: JSON.stringify({
        vendor_id: vendor.id,
        vendor_bill_number: billNumber,
        bill_date: '2026-05-18',
        due_date: '2026-06-18',
        is_interstate: false,
        items: [{ description: 'Duplicate', quantity: 1, unit_price: 100, tax_rate: 18 }]
      }),
    });
    test('AC-10b: Duplicate Vendor Bill Number Rejection', 
      dupRes.status === 409 || dupRes.status === 400,
      `Duplicate bill number rejected with ${dupRes.status}`);

    // AC-11: Vendor Payment
    const payRes = await request('/vendor-payments', {
      method: 'POST',
      headers: ceoHeaders,
      body: JSON.stringify({
        vendor_id: vendor.id,
        payment_date: '2026-05-25',
        amount: 25000,
        payment_mode: 'BANK_TRANSFER',
        paying_account_id: hdfcBank.id,
        reference_number: 'IMPS-99881122',
        remarks: 'Part payment for server hardware',
        allocations: [
          {
            bill_id: billId,
            allocated_amount: 25000,
          }
        ]
      }),
    });

    const updatedBillRes = await request(`/vendor-bills/${billId}`, { headers: ceoHeaders });
    const updatedBill = updatedBillRes.data?.data;

    test('AC-11: Vendor Disbursement & AP Allocation',
      Number(updatedBill?.amount_paid) === 25000 && 
      Number(updatedBill?.balance_due) === 34000 &&
      updatedBill?.status === 'PARTIALLY_PAID',
      `Paid: ₹${updatedBill?.amount_paid}, Balance Due: ₹${updatedBill?.balance_due}`);
  } catch (err) {
    test('AC-10 & AC-11: Vendor Bills & Payments', false, err.message);
  }

  // AC-12: Cash & Operating Expense Recording
  try {
    const expCatRes = await request('/expenses/categories', { headers: ceoHeaders });
    const category = expCatRes.data?.data?.[0];

    const expRes = await request('/expenses', {
      method: 'POST',
      headers: ceoHeaders,
      body: JSON.stringify({
        expense_date: '2026-05-21',
        category_id: category.id,
        account_id: cashAccount.id,
        taxable_amount: 4500,
        payment_mode: 'CASH',
        description: 'Office pantry & refreshment supplies',
      }),
    });
    const expense = expRes.data?.data;

    test('AC-12: Cash Expense Recording & Balance Deduction',
      expense?.status === 'POSTED' && Number(expense?.total_amount) === 4500,
      `Voucher: ${expense?.expense_number}, Amount: ₹${expense?.total_amount}`);
  } catch (err) {
    test('AC-12: Cash Expense Recording', false, err.message);
  }

  // AC-13 & AC-14: Payroll Calculation, Journal Posting & Disbursement
  try {
    const testMonth = 7 + (Math.floor(Date.now() / 1000) % 5);
    const payrollRunRes = await request('/payroll/calculate', {
      method: 'POST',
      headers: ceoHeaders,
      body: JSON.stringify({
        month: testMonth,
        year: 2026,
      }),
    });
    const payrollRun = payrollRunRes.data?.data;

    const calcItem = payrollRun?.items?.find(i => i.employee_id === employee.id);
    test('AC-13: Monthly Payroll Computation',
      !!payrollRun?.id && !!calcItem && Number(calcItem?.pf_deduction) > 0,
      `Emp: ${employee.name}, Gross: ₹${calcItem?.gross_earnings}, PF: ₹${calcItem?.pf_deduction}, Net: ₹${calcItem?.net_pay}`);

    // Post Payroll Journal Entry
    const postJournalRes = await request(`/payroll/${payrollRun.id}/post`, {
      method: 'POST',
      headers: ceoHeaders,
    });
    test('AC-14a: Payroll Journal Posting', postJournalRes.data?.data?.status === 'POSTED', 'Salary Expense Dr, Net Salary Payable & Deductions Cr');

    // Disburse Salary
    const disburseRes = await request(`/payroll/${payrollRun.id}/payments`, {
      method: 'POST',
      headers: ceoHeaders,
      body: JSON.stringify({
        item_id: calcItem.id,
        bank_account_id: hdfcBank.id,
        payment_mode: 'BANK_TRANSFER',
      }),
    });
    test('AC-14b: Payroll Disbursement', disburseRes.ok, 'Net Salary Payable cleared, Bank debited');
  } catch (err) {
    test('AC-13 & AC-14: Payroll Lifecycle', false, err.message);
  }

  // AC-17: Cash & Bank Internal Transfer
  try {
    const transferRes = await request('/cash-bank/transfer', {
      method: 'POST',
      headers: ceoHeaders,
      body: JSON.stringify({
        from_account_id: hdfcBank.id,
        to_account_id: cashAccount.id,
        amount: 10000,
        date: '2026-05-22',
        description: 'Cash withdrawal for petty expenses',
      }),
    });
    test('AC-17: Internal Bank to Cash Transfer',
      transferRes.ok && transferRes.data?.data?.message === 'Transfer completed successfully',
      `Transfer Reference: ${transferRes.data?.data?.journal_entry?.entry_number}`);
  } catch (err) {
    test('AC-17: Internal Transfer', false, err.message);
  }

  // AC-18: Strict Unbalanced Journal Rejection
  try {
    const coaRes = await request('/accounts', { headers: ceoHeaders });
    const coa = coaRes.data?.data;
    const acc1 = coa[0];
    const acc2 = coa[1];

    const unbRes = await request('/journals', {
      method: 'POST',
      headers: ceoHeaders,
      body: JSON.stringify({
        posting_date: '2026-05-22',
        narration: 'Intentionally unbalanced test journal',
        lines: [
          { account_id: acc1.id, debit: 5000, credit: 0 },
          { account_id: acc2.id, debit: 0, credit: 4000 }, // Unequal!
        ]
      }),
    });
    test('AC-18: Reject Unbalanced Journal Entry',
      unbRes.status === 400,
      `Successfully rejected: ${unbRes.data?.error?.message || unbRes.data?.message || 'Debits != Credits'}`);
  } catch (err) {
    test('AC-18: Reject Unbalanced Journal Entry', false, err.message);
  }

  // AC-19: Journal Reversal & Audit Trail
  try {
    const coaRes = await request('/accounts', { headers: ceoHeaders });
    const coa = coaRes.data?.data;
    const acc1 = coa[0];
    const acc2 = coa[1];

    const manualRes = await request('/journals', {
      method: 'POST',
      headers: ceoHeaders,
      body: JSON.stringify({
        posting_date: '2026-05-23',
        narration: 'Manual test entry for reversal test',
        lines: [
          { account_id: acc1.id, debit: 1250, credit: 0 },
          { account_id: acc2.id, debit: 0, credit: 1250 },
        ]
      }),
    });
    const entryId = manualRes.data?.data?.id;

    // Now reverse it
    const revRes = await request(`/journals/${entryId}/reverse`, {
      method: 'POST',
      headers: ceoHeaders,
      body: JSON.stringify({
        reason: 'Reversing erroneous manual test journal'
      }),
    });
    test('AC-19: Journal Entry Reversal & Immutability',
      revRes.data?.data?.status === 'POSTED' && revRes.data?.data?.reversal_of_id === entryId,
      `Reversal Entry Number: ${revRes.data?.data?.entry_number}`);
  } catch (err) {
    test('AC-19: Journal Reversal', false, err.message);
  }

  // AC-20 & AC-21: Trial Balance & Balance Sheet Equation Checks
  try {
    const tbRes = await request('/reports/trial-balance', { headers: ceoHeaders });
    const tb = tbRes.data?.data;
    const isTbBalanced = tb?.is_balanced && Math.abs(tb?.total_debit - tb?.total_credit) < 0.01;
    test('AC-20: Trial Balance Reconciliation', isTbBalanced,
      `Debits: ₹${tb?.total_debit?.toLocaleString('en-IN')}, Credits: ₹${tb?.total_credit?.toLocaleString('en-IN')}, Balanced: ${tb?.is_balanced}`);

    const plRes = await request('/reports/profit-loss', { headers: ceoHeaders });
    const pl = plRes.data?.data;
    test('AC-21a: Profit & Loss Statement', typeof pl?.net_profit === 'number',
      `Revenue: ₹${pl?.income?.total_income?.toLocaleString('en-IN')}, Expenses: ₹${pl?.expenses?.total_expense?.toLocaleString('en-IN')}, Net Profit: ₹${pl?.net_profit?.toLocaleString('en-IN')}`);

    const bsRes = await request('/reports/balance-sheet', { headers: ceoHeaders });
    const bs = bsRes.data?.data;
    const isBsBalanced = bs?.is_balanced;
    test('AC-21b: Balance Sheet Fundamental Accounting Equation (Assets = Liabilities + Equity)',
      isBsBalanced,
      `Assets: ₹${bs?.assets?.total_assets?.toLocaleString('en-IN')} | Liab+Eq: ₹${(bs?.total_liabilities_and_equity)?.toLocaleString('en-IN')} | Balanced: ${bs?.is_balanced}`);

    const gstRes = await request('/reports/gstr3b', { headers: ceoHeaders });
    const gstr3b = gstRes.data?.data;
    test('AC-22: GSTR-3B Tax Summary Calculation',
      typeof gstr3b?.net_tax_position?.total_net_payable === 'number' && typeof gstr3b?.eligible_itc?.total_itc === 'number',
      `Outward Tax: ₹${gstr3b?.output_tax?.total_output_tax}, Eligible ITC: ₹${gstr3b?.eligible_itc?.total_itc}, Net Position: ₹${gstr3b?.net_tax_position?.total_net_payable}`);
  } catch (err) {
    test('AC-20, AC-21, AC-22: Financial & GST Reports', false, err.message);
  }

  console.log('\n===============================================================');
  console.log(`              FINAL RESULT: ${passed}/${total} TESTS PASSED               `);
  console.log('===============================================================\n');

  if (passed === total) {
    console.log('🎉 ALL SRS ACCEPTANCE CRITERIA VERIFIED SUCCESSFULLY!');
  } else {
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
