const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

const isEmailConfigured = () => {
  return Boolean(
    process.env.BREVO_API_KEY &&
    process.env.BREVO_SENDER_EMAIL
  );
};

const escapeHtml = (value = '') => {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const money = (amount) => {
  return `₹${Number(amount || 0).toFixed(2)}`;
};

const formatDate = (date) => {
  if (!date) return '-';

  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const createEmailHtml = ({
  title,
  subtitle,
  content,
  type = 'info',
}) => {
  let accent = '#2563eb';

  if (type === 'expense') accent = '#dc2626';
  if (type === 'task') accent = '#7c3aed';
  if (type === 'due') accent = '#ea580c';
  if (type === 'fund') accent = '#dc2626';
  if (type === 'payment') accent = '#16a34a';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>

<body style="
  margin:0;
  padding:0;
  background:#f1f5f9;
  font-family:Arial,Helvetica,sans-serif;
">

<div style="
  max-width:680px;
  margin:30px auto;
  background:#ffffff;
  border-radius:14px;
  overflow:hidden;
  box-shadow:0 5px 25px rgba(0,0,0,0.08);
">

  <div style="
    background:${accent};
    padding:25px;
    color:white;
  ">
    <h1 style="margin:0;font-size:24px;">
      ${escapeHtml(title)}
    </h1>

    <p style="
      margin:8px 0 0;
      opacity:.9;
      font-size:14px;
    ">
      ${escapeHtml(subtitle || 'RoomMate Pro Notification')}
    </p>
  </div>

  <div style="
    padding:28px;
    color:#334155;
    font-size:15px;
    line-height:1.7;
  ">
    ${content}
  </div>

  <div style="
    padding:18px 28px;
    background:#f8fafc;
    border-top:1px solid #e2e8f0;
    color:#64748b;
    font-size:12px;
    text-align:center;
  ">
    This is an automatic notification from RoomMate Pro.
  </div>

</div>

</body>
</html>
`;
};

export const sendBrevoEmail = async ({
  to,
  subject,
  html,
}) => {
  try {
    if (!isEmailConfigured()) {
      console.warn('[Brevo] Email configuration missing. Email skipped.');
      return false;
    }

    if (!to) {
      console.warn('[Brevo] Recipient email missing. Email skipped.');
      return false;
    }

    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: process.env.BREVO_SENDER_NAME || 'RoomMate Pro',
          email: process.env.BREVO_SENDER_EMAIL,
        },
        to: [
          {
            email: to,
          },
        ],
        subject,
        htmlContent: html,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();

      console.error(
        '[Brevo] Email failed:',
        response.status,
        errorText
      );

      return false;
    }

    console.log(`[Brevo] Email sent successfully to ${to}`);

    return true;
  } catch (error) {
    console.error('[Brevo] Email error:', error.message);

    return false;
  }
};

export const sendNewExpenseEmail = async ({
  member,
  expense,
  addedBy,
  paidByName,
}) => {
  if (!member?.email) return;

  const splitAmount =
    expense.splitAmong?.find(
      (item) =>
        item.user &&
        item.user._id?.toString() === member._id?.toString()
    )?.amount;

  const html = createEmailHtml({
    title: '🧾 New Expense Added',
    subtitle: 'Room expense notification',
    type: 'expense',

    content: `
      <p>Hello <strong>${escapeHtml(member.name)}</strong>,</p>

      <p>
        A new expense has been added to the room management account.
      </p>

      <div style="
        background:#f8fafc;
        padding:18px;
        border-radius:10px;
        margin:20px 0;
      ">

        <p><strong>Expense:</strong> ${escapeHtml(expense.title)}</p>

        <p><strong>Amount:</strong> ${money(expense.amount)}</p>

        <p><strong>Category:</strong> ${escapeHtml(expense.category)}</p>

        <p><strong>Date:</strong> ${formatDate(expense.date)}</p>

        <p><strong>Paid By:</strong> ${escapeHtml(paidByName || '-')}</p>

        <p><strong>Added By:</strong> ${escapeHtml(addedBy?.name || '-')}</p>

        ${
          splitAmount !== undefined
            ? `<p><strong>Your Share:</strong> ${money(splitAmount)}</p>`
            : ''
        }

        ${
          expense.description
            ? `
              <p>
                <strong>Description:</strong><br/>
                ${escapeHtml(expense.description)}
              </p>
            `
            : ''
        }

      </div>

      <p>
        Please check the RoomMate Pro application for complete expense details.
      </p>
    `,
  });

  await sendBrevoEmail({
    to: member.email,
    subject: `🧾 New Expense: ${expense.title} - ${money(expense.amount)}`,
    html,
  });
};

export const sendTaskAssignedEmail = async ({
  member,
  task,
  admin,
}) => {
  if (!member?.email) return;

  const html = createEmailHtml({
    title: '📋 New Task Assigned',
    subtitle: 'Pending work notification',
    type: 'task',

    content: `
      <p>Hello <strong>${escapeHtml(member.name)}</strong>,</p>

      <p>
        A new task has been assigned to you by
        <strong>${escapeHtml(admin?.name || 'Admin')}</strong>.
      </p>

      <div style="
        background:#f8fafc;
        padding:18px;
        border-radius:10px;
        margin:20px 0;
      ">

        <p>
          <strong>Task:</strong>
          ${escapeHtml(task.title)}
        </p>

        <p>
          <strong>Priority:</strong>
          ${escapeHtml(task.priority || 'medium')}
        </p>

        <p>
          <strong>Assigned By:</strong>
          ${escapeHtml(admin?.name || 'Admin')}
        </p>

        <p>
          <strong>Assigned Date:</strong>
          ${formatDate(task.assignedDate)}
        </p>

        ${
          task.dueDate
            ? `
              <p>
                <strong>Due Date:</strong>
                ${formatDate(task.dueDate)}
              </p>
            `
            : ''
        }

        <p>
          <strong>Description:</strong><br/>
          ${escapeHtml(task.description)}
        </p>

        ${
          task.photo
            ? `
              <p>
                <strong>Task attachment:</strong>
                Photo is available in the RoomMate Pro application.
              </p>
            `
            : ''
        }

      </div>

      <p>
        Please open the application and update the task status after starting or completing the work.
      </p>
    `,
  });

  await sendBrevoEmail({
    to: member.email,
    subject: `📋 New Task Assigned: ${task.title}`,
    html,
  });
};

export const sendDueEmail = async ({
  member,
  monthKey,
  pendingDue,
}) => {
  if (!member?.email || Number(pendingDue) <= 0) return;

  const html = createEmailHtml({
    title: '💰 Pending Room Due',
    subtitle: `Financial update for ${monthKey}`,
    type: 'due',

    content: `
      <p>
        Hello <strong>${escapeHtml(member.name)}</strong>,
      </p>

      <p>
        Your current room account shows a pending amount.
      </p>

      <div style="
        background:#fff7ed;
        border:1px solid #fed7aa;
        padding:22px;
        border-radius:12px;
        margin:20px 0;
        text-align:center;
      ">

        <div style="
          font-size:13px;
          color:#9a3412;
        ">
          Pending Due
        </div>

        <div style="
          font-size:32px;
          font-weight:bold;
          color:#c2410c;
          margin-top:8px;
        ">
          ${money(pendingDue)}
        </div>

        <div style="
          margin-top:8px;
          font-size:13px;
          color:#64748b;
        ">
          Month: ${escapeHtml(monthKey)}
        </div>

      </div>

      <p>
        Please settle the pending amount through the room management system.
      </p>
    `,
  });

  await sendBrevoEmail({
    to: member.email,
    subject: `💰 Pending Due: ${money(pendingDue)} - ${monthKey}`,
    html,
  });
};

export const sendFundZeroEmail = async ({
  totalFund,
  usedFund,
  admin,
  monthKey,
}) => {
  const adminEmail =
    admin?.email || process.env.ADMIN_EMAIL;

  if (!adminEmail) return;

  const html = createEmailHtml({
    title: '🚨 Room Fund Reached ₹0',
    subtitle: `Room common fund alert - ${monthKey}`,
    type: 'fund',

    content: `
      <p>
        Hello <strong>${escapeHtml(admin?.name || 'Admin')}</strong>,
      </p>

      <p>
        The Room Common Fund has reached <strong>₹0</strong>.
      </p>

      <div style="
        background:#fef2f2;
        border:1px solid #fecaca;
        padding:20px;
        border-radius:12px;
        margin:20px 0;
      ">

        <p>
          <strong>Total Fund:</strong>
          ${money(totalFund)}
        </p>

        <p>
          <strong>Used Fund:</strong>
          ${money(usedFund)}
        </p>

        <p>
          <strong>Remaining Fund:</strong>
          <span style="color:#dc2626;font-weight:bold;">
            ₹0.00
          </span>
        </p>

        <p>
          <strong>Month:</strong>
          ${escapeHtml(monthKey)}
        </p>

      </div>

      <p>
        Please add funds or collect member payments before recording another Room Common Fund expense.
      </p>
    `,
  });

  await sendBrevoEmail({
    to: adminEmail,
    subject: `🚨 Room Fund Reached ₹0 - ${monthKey}`,
    html,
  });
};

export const sendPaymentEmail = async ({
  member,
  amount,
  paymentMethod,
  paymentType,
  notes,
  recordedBy,
}) => {
  if (!member?.email) return;

  const html = createEmailHtml({
    title: '💳 Payment Recorded',
    subtitle: 'Room payment confirmation',
    type: 'payment',

    content: `
      <p>
        Hello <strong>${escapeHtml(member.name)}</strong>,
      </p>

      <p>
        Your payment has been recorded successfully.
      </p>

      <div style="
        background:#f0fdf4;
        border:1px solid #bbf7d0;
        padding:20px;
        border-radius:12px;
        margin:20px 0;
      ">

        <p>
          <strong>Amount:</strong>
          ${money(amount)}
        </p>

        <p>
          <strong>Payment Method:</strong>
          ${escapeHtml(paymentMethod || '-')}
        </p>

        <p>
          <strong>Payment Type:</strong>
          ${escapeHtml(paymentType || '-')}
        </p>

        <p>
          <strong>Recorded By:</strong>
          ${escapeHtml(recordedBy?.name || '-')}
        </p>

        ${
          notes
            ? `<p><strong>Notes:</strong><br/>${escapeHtml(notes)}</p>`
            : ''
        }

      </div>
    `,
  });

  await sendBrevoEmail({
    to: member.email,
    subject: `💳 Payment Recorded - ${money(amount)}`,
    html,
  });
};
