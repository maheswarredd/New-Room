import React from 'react';
import {
  Wallet,
  TrendingDown,
  Banknote,
  Clock,
  PlusCircle,
  History,
} from 'lucide-react';

export default function RoomFundManagement() {
  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Room Fund Management
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Manage room contributions, fund expenses and available balance.
        </p>
      </div>

      {/* Fund Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-3">
              <Wallet className="h-6 w-6 text-blue-600" />
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Total Room Fund
              </p>

              <h2 className="text-2xl font-bold text-slate-800">
                ₹0.00
              </h2>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-red-50 p-3">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Used Room Fund
              </p>

              <h2 className="text-2xl font-bold text-slate-800">
                ₹0.00
              </h2>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-green-50 p-3">
              <Banknote className="h-6 w-6 text-green-600" />
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Available Room Fund
              </p>

              <h2 className="text-2xl font-bold text-slate-800">
                ₹0.00
              </h2>
            </div>
          </div>
        </div>

      </div>

      {/* Pending Contributions */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

        <div className="mb-4 flex items-center gap-3">
          <Clock className="h-6 w-6 text-amber-600" />

          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Pending Room Fund Contributions
            </h2>

            <p className="text-sm text-slate-500">
              Review contributions submitted by members.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">

            <thead className="border-b bg-slate-50 text-slate-500">
              <tr>
                <th className="p-3">Member</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Date</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td
                  colSpan={5}
                  className="p-6 text-center text-slate-500"
                >
                  Contribution data will appear here.
                </td>
              </tr>
            </tbody>

          </table>
        </div>

      </div>

      {/* Fund Expense Section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

        <div className="mb-4 flex items-center gap-3">
          <PlusCircle className="h-6 w-6 text-indigo-600" />

          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Room Fund Expenses
            </h2>

            <p className="text-sm text-slate-500">
              Record expenses paid from the shared Room Fund.
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-500">
          Expense entry form will be connected to the backend.
        </p>

      </div>

      {/* Fund History */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

        <div className="mb-4 flex items-center gap-3">
          <History className="h-6 w-6 text-indigo-600" />

          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Room Fund History
            </h2>

            <p className="text-sm text-slate-500">
              View approved contributions and Room Fund expenses.
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-500">
          Room Fund transaction history will appear here.
        </p>

      </div>

    </div>
  );
}
