"use client";
import { useEffect, useMemo, useState } from "react";
import { apiCall } from "../../../utils/api";
import URL from "../../../utils/url";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const emptySection = {
  count: 0,
  todayCount: 0,
  data: [],
};

const emptyDashboard = {
  verifiedNotRegistered: emptySection,
  registeredNoPlan: emptySection,
  registeredWithPlan: emptySection,
};

/* ---------------------------- formatting utils --------------------------- */

const formatNumber = (value) => {
  if (value === null || value === undefined) return "0";
  return new Intl.NumberFormat("en-IN").format(Number(value) || 0);
};

const formatDateTime = (value) => {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return "-";
  }
};

const trimValue = (value) => {
  if (typeof value !== "string") return value ?? "-";
  const trimmed = value.trim();
  return trimmed || "-";
};

const joinAddress = (address) => {
  if (!address) return "-";
  const parts = [address.street, address.city, address.state, address.country]
    .map(trimValue)
    .filter((part) => part && part !== "-");
  return parts.length ? parts.join(", ") : "-";
};

const safeSection = (section) => ({
  count: Number(section?.count) || 0,
  todayCount: Number(section?.todayCount) || 0,
  data: Array.isArray(section?.data) ? section.data : [],
});

const isSameDay = (dateValue) => {
  if (!dateValue) return false;
  const current = new Date();
  const target = new Date(dateValue);
  return (
    current.getFullYear() === target.getFullYear() &&
    current.getMonth() === target.getMonth() &&
    current.getDate() === target.getDate()
  );
};

const formatMonthValue = (dateValue) => {
  if (!dateValue) return "";
  const target = new Date(dateValue);
  return `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, "0")}`;
};

const formatDateValue = (dateValue) => {
  if (!dateValue) return "";
  const target = new Date(dateValue);
  const year = target.getFullYear();
  const month = String(target.getMonth() + 1).padStart(2, "0");
  const day = String(target.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const isSameMonth = (dateValue, monthValue) => {
  if (!dateValue || !monthValue) return true;
  return formatMonthValue(dateValue) === monthValue;
};

const isSameDate = (dateValue, dateFilter) => {
  if (!dateValue || !dateFilter) return true;
  return formatDateValue(dateValue) === dateFilter;
};

const formatCurrency = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
};

const formatPlanRange = (startDate, endDate) => {
  if (!startDate && !endDate) return "-";
  return `${formatDateTime(startDate)} - ${formatDateTime(endDate)}`;
};

/* ---------------------------- row normalizers ----------------------------- */
// Every bucket is normalized into the same row shape so the table and filters
// stay generic instead of branching per bucket.

const normalizeVerified = (items) =>
  items.map((item, idx) => ({
    id: item?._id || `otp-${item?.phone}-${idx}`,
    type: "otp",
    typeLabel: "OTP verified",
    name: "-",
    phone: trimValue(item?.phone),
    email: "-",
    store: "-",
    date: item?.otpVerifiedAt,
    raw: item,
  }));

const normalizeNoPlan = (items) =>
  items.map((item, idx) => ({
    id: item?._id || `reg-${item?.phone}-${idx}`,
    type: "registered",
    typeLabel: "Registered",
    name: trimValue(item?.name),
    phone: trimValue(item?.phone),
    email: trimValue(item?.email),
    store: "-",
    date: item?.createdAt,
    raw: item,
  }));

const normalizeWithPlan = (items) =>
  items.map((item, idx) => ({
    id: item?._id || `plan-${item?.amdaaniId}-${idx}`,
    type: "plan",
    typeLabel: "Active plan",
    name: trimValue(item?.name),
    phone: trimValue(item?.phone),
    email: trimValue(item?.email),
    store: trimValue(item?.store?.name),
    date: item?.createdAt,
    raw: item,
  }));

const byDateDesc = (a, b) =>
  new Date(b?.date || 0).getTime() - new Date(a?.date || 0).getTime();

export default function Page() {
  const [dashboard, setDashboard] = useState(emptyDashboard);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedBucket, setSelectedBucket] = useState("all");
  const [selectedView, setSelectedView] = useState("overall");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [selectedPlanUser, setSelectedPlanUser] = useState(null);
  const [selectedPlanDetails, setSelectedPlanDetails] = useState(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState("");

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await apiCall({
        endpoint: URL.dashboardTracking,
        method: "GET",
      });

      if (response?.success) {
        setDashboard({
          verifiedNotRegistered: safeSection(response?.data?.verifiedNotRegistered),
          registeredNoPlan: safeSection(response?.data?.registeredNoPlan),
          registeredWithPlan: safeSection(response?.data?.registeredWithPlan),
        });
        return;
      }

      setError(response?.message || "Failed to load dashboard analytics.");
    } catch (fetchError) {
      console.error("Dashboard fetch error:", fetchError);
      setError("Failed to load dashboard analytics. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const closePlanDialog = () => {
    setPlanDialogOpen(false);
    setSelectedPlanUser(null);
    setSelectedPlanDetails(null);
    setPlanError("");
    setPlanLoading(false);
  };

  const openPlanDialog = async (rawUser) => {
    const userId = rawUser?._id || rawUser?.userId;
    if (!userId) return;

    setSelectedPlanUser(rawUser);
    setSelectedPlanDetails(null);
    setPlanError("");
    setPlanDialogOpen(true);
    setPlanLoading(true);

    try {
      const response = await apiCall({
        endpoint: `${URL.userSubscription}/${userId}`,
        method: "GET",
      });

      if (response?.success) {
        setSelectedPlanDetails(response.data || null);
      } else {
        setPlanError(response?.message || "Failed to fetch plan details.");
      }
    } catch (fetchError) {
      console.error("Plan details fetch error:", fetchError);
      setPlanError("Failed to fetch plan details. Please try again.");
    } finally {
      setPlanLoading(false);
    }
  };

  /* --------------------------- derived data --------------------------- */

  const normalized = useMemo(() => {
    const verified = normalizeVerified(dashboard.verifiedNotRegistered.data);
    const registered = normalizeNoPlan(dashboard.registeredNoPlan.data);
    const withPlan = normalizeWithPlan(dashboard.registeredWithPlan.data);
    const all = [...verified, ...registered, ...withPlan].sort(byDateDesc);
    return { verified, registered, withPlan, all };
  }, [dashboard]);

  const totalTracked =
    dashboard.verifiedNotRegistered.count +
    dashboard.registeredNoPlan.count +
    dashboard.registeredWithPlan.count;

  const todayTracked =
    dashboard.verifiedNotRegistered.todayCount +
    dashboard.registeredNoPlan.todayCount +
    dashboard.registeredWithPlan.todayCount;

  const planEligibleTotal = dashboard.registeredNoPlan.count + dashboard.registeredWithPlan.count;

  const planAdoption = planEligibleTotal
    ? Math.round((dashboard.registeredWithPlan.count / planEligibleTotal) * 100)
    : 0;

  const activeStores = new Set(
    dashboard.registeredWithPlan.data.map((item) => item?.store?._id).filter(Boolean)
  ).size;

  const buckets = {
    all: {
      label: "All users",
      description: "Every tracked user across every stage.",
      items: normalized.all,
      count: totalTracked,
      todayCount: todayTracked,
    },
    verifiedNotRegistered: {
      label: "OTP verified, not registered",
      description: "Verified OTP but did not complete signup.",
      items: normalized.verified,
      count: dashboard.verifiedNotRegistered.count,
      todayCount: dashboard.verifiedNotRegistered.todayCount,
    },
    registeredNoPlan: {
      label: "Registered, no plan",
      description: "Signed up, no active subscription yet.",
      items: normalized.registered,
      count: dashboard.registeredNoPlan.count,
      todayCount: dashboard.registeredNoPlan.todayCount,
    },
    registeredWithPlan: {
      label: "Registered with plan",
      description: "Onboarded users on an active plan.",
      items: normalized.withPlan,
      count: dashboard.registeredWithPlan.count,
      todayCount: dashboard.registeredWithPlan.todayCount,
    },
  };

  const activeBucket = buckets[selectedBucket] || buckets.all;

  const filteredItems = useMemo(() => {
    const source = selectedView === "today"
      ? activeBucket.items.filter((item) => isSameDay(item.date))
      : activeBucket.items.filter(
          (item) => isSameMonth(item.date, selectedMonth) && isSameDate(item.date, selectedDate)
        );
    return source;
  }, [activeBucket, selectedView, selectedMonth, selectedDate]);

  const hasDateFilter = Boolean(selectedMonth || selectedDate);
  const emptyText =
    selectedView === "today"
      ? "No records for today."
      : hasDateFilter
        ? "No records match the selected date filter."
        : "No records found.";

  const kpiCards = [
    { key: "all", label: "Total tracked", value: totalTracked, hint: `${formatNumber(todayTracked)} today` },
    { key: "registeredWithPlan", label: "Active stores", value: activeStores, hint: "Linked to a plan" },
    { key: null, label: "Plan adoption", value: `${planAdoption}%`, hint: `${formatNumber(planEligibleTotal)} eligible users` },
    { key: null, label: "Today, all stages", value: todayTracked, hint: "New activity today" },
  ];

  const summaryCards = [
    {
      key: "verifiedNotRegistered",
      label: "OTP verified, not registered",
      value: buckets.verifiedNotRegistered.count,
      today: buckets.verifiedNotRegistered.todayCount,
    },
    {
      key: "registeredNoPlan",
      label: "Registered, no plan",
      value: buckets.registeredNoPlan.count,
      today: buckets.registeredNoPlan.todayCount,
    },
    {
      key: "registeredWithPlan",
      label: "Registered with plan",
      value: buckets.registeredWithPlan.count,
      today: buckets.registeredWithPlan.todayCount,
    },
  ];

  const selectBucket = (key, view = "overall") => {
    setSelectedBucket(key);
    setSelectedView(view);
  };

  return (
    <main className="dash">
      <div className="dash-container">
        <header className="dash-header">
          <div>
            <h1>Onboarding dashboard</h1>
            <p>Verification, registration, and plan status across all users.</p>
          </div>
          <button type="button" className="btn-refresh" onClick={fetchDashboard} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </header>

        {error ? (
          <section className="error-banner" role="alert">
            <div>
              <strong>Couldn&apos;t load dashboard data</strong>
              <p>{error}</p>
            </div>
            <button type="button" onClick={fetchDashboard}>Retry</button>
          </section>
        ) : null}

        <section className="kpi-grid">
          {kpiCards.map((card) => (
            <button
              key={card.label}
              type="button"
              className={`kpi-card ${card.key ? "kpi-clickable" : ""} ${card.key && selectedBucket === card.key ? "kpi-active" : ""}`}
              onClick={card.key ? () => selectBucket(card.key) : undefined}
              disabled={!card.key}
            >
              <span className="kpi-label">{card.label}</span>
              <strong className="kpi-value">{loading ? "—" : formatNumber(card.value)}</strong>
              <span className="kpi-hint">{loading ? " " : card.hint}</span>
            </button>
          ))}
        </section>

        <section className="bucket-grid">
          {summaryCards.map((card) => (
            <article
              key={card.key}
              className={`bucket-card ${selectedBucket === card.key ? "bucket-active" : ""}`}
              role="button"
              tabIndex={0}
              onClick={() => selectBucket(card.key)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  selectBucket(card.key);
                }
              }}
            >
              <div className="bucket-card-top">
                <span className="bucket-title">{card.label}</span>
                <span className="bucket-count">{loading ? "—" : formatNumber(card.value)}</span>
              </div>
              <div className="bucket-actions">
                <button type="button" onClick={(e) => { e.stopPropagation(); selectBucket(card.key, "today"); }}>
                  Today · {formatNumber(card.today)}
                </button>
                <button type="button" className="secondary" onClick={(e) => { e.stopPropagation(); selectBucket(card.key, "overall"); }}>
                  Overall · {formatNumber(card.value)}
                </button>
              </div>
            </article>
          ))}
        </section>

        <section className="table-panel">
          <div className="table-panel-head">
            <div>
              <h2>{activeBucket.label}</h2>
              <p>{activeBucket.description} {selectedView === "today" ? "Showing today only." : "Showing all matching records."}</p>
            </div>
            <span className="row-count">{loading ? "Loading…" : `${formatNumber(filteredItems.length)} records`}</span>
          </div>

          <div className="table-controls">
            <div className="view-toggle">
              <button
                type="button"
                className={selectedView === "overall" ? "active" : ""}
                onClick={() => setSelectedView("overall")}
              >
                Overall
              </button>
              <button
                type="button"
                className={selectedView === "today" ? "active" : ""}
                onClick={() => setSelectedView("today")}
              >
                Today
              </button>
            </div>

            {selectedView === "overall" ? (
              <div className="filter-row">
                <label>
                  <span>Month</span>
                  <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
                </label>
                <label>
                  <span>Date</span>
                  <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                </label>
                {hasDateFilter ? (
                  <button type="button" className="clear-filters" onClick={() => { setSelectedMonth(""); setSelectedDate(""); }}>
                    Clear
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>

          {filteredItems.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Store</th>
                    <th>Date</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr key={item.id}>
                      <td><span className={`type-badge type-${item.type}`}>{item.typeLabel}</span></td>
                      <td>{item.name}</td>
                      <td>{item.phone}</td>
                      <td>{item.email}</td>
                      <td>{item.store}</td>
                      <td>{formatDateTime(item.date)}</td>
                      <td>
                        {item.type === "plan" ? (
                          <button type="button" className="view-plan-btn" onClick={() => openPlanDialog(item.raw)}>
                            View plan
                          </button>
                        ) : (
                          <span className="cell-muted">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">{loading ? "Loading records…" : emptyText}</div>
          )}
        </section>
      </div>

      <Dialog open={planDialogOpen} onOpenChange={(next) => (next ? setPlanDialogOpen(true) : closePlanDialog())}>
        <DialogContent className="plan-dialog-content !h-[90vh] !max-h-[90vh] !w-[94vw] !max-w-[94vw] overflow-hidden border-0 bg-transparent p-0 shadow-none lg:!w-[80vw] lg:!max-w-[80vw]">
          <div className="plan-modal">
            <DialogHeader className="plan-modal-header">
              <DialogTitle>{selectedPlanUser?.name || selectedPlanUser?.amdaaniId || "Subscription details"}</DialogTitle>
            </DialogHeader>

            <div className="plan-modal-body">
              {planLoading ? (
                <div className="plan-placeholder">Loading plan details…</div>
              ) : planError ? (
                <div className="plan-placeholder plan-error">
                  <strong>Unable to load subscription</strong>
                  <p>{planError}</p>
                </div>
              ) : selectedPlanDetails ? (
                <>
                  <div className="plan-summary-grid">
                    <div className="plan-summary-card">
                      <span>Current plan</span>
                      <strong>{trimValue(selectedPlanDetails?.currentPlan?.planName)}</strong>
                      <p>{trimValue(selectedPlanDetails?.currentPlan?.plan?.description)}</p>
                    </div>
                    <div className="plan-summary-card">
                      <span>Expiry date</span>
                      <strong>{formatDateTime(selectedPlanDetails?.currentPlan?.endDate)}</strong>
                      <p>{formatPlanRange(selectedPlanDetails?.currentPlan?.startDate, selectedPlanDetails?.currentPlan?.endDate)}</p>
                    </div>
                    <div className="plan-summary-card">
                      <span>Payments</span>
                      <strong>{formatNumber(selectedPlanDetails?.payments?.length || 0)}</strong>
                      <p>Recorded payments on this account.</p>
                    </div>
                  </div>

                  <div className="plan-detail-grid">
                    <section className="plan-section">
                      <h3>User &amp; store</h3>
                      <div className="plan-detail-list">
                        <div><span>User ID</span><strong>{trimValue(selectedPlanDetails?.user?.amdaaniId)}</strong></div>
                        <div><span>Name</span><strong>{trimValue(selectedPlanDetails?.user?.name)}</strong></div>
                        <div><span>Phone</span><strong>{trimValue(selectedPlanDetails?.user?.phone)}</strong></div>
                        <div><span>Email</span><strong>{trimValue(selectedPlanDetails?.user?.email)}</strong></div>
                        <div><span>Store</span><strong>{trimValue(selectedPlanDetails?.store?.name)}</strong></div>
                        <div><span>Address</span><strong>{joinAddress(selectedPlanDetails?.store?.address)}</strong></div>
                      </div>
                    </section>

                    <section className="plan-section">
                      <h3>Current plan</h3>
                      <div className="plan-detail-list">
                        <div><span>Plan name</span><strong>{trimValue(selectedPlanDetails?.currentPlan?.planName)}</strong></div>
                        <div><span>Status</span><strong>{trimValue(selectedPlanDetails?.currentPlan?.status)}</strong></div>
                        <div><span>Price</span><strong>{formatCurrency(selectedPlanDetails?.currentPlan?.price)}</strong></div>
                        <div><span>Duration</span><strong>{formatNumber(selectedPlanDetails?.currentPlan?.durationDays)} days</strong></div>
                        <div><span>Start date</span><strong>{formatDateTime(selectedPlanDetails?.currentPlan?.startDate)}</strong></div>
                        <div><span>End date</span><strong>{formatDateTime(selectedPlanDetails?.currentPlan?.endDate)}</strong></div>
                      </div>
                    </section>
                  </div>

                  <section className="plan-section">
                    <h3>Previous plan</h3>
                    {selectedPlanDetails?.previousPlan ? (
                      <div className="plan-detail-list two-col">
                        <div><span>Plan name</span><strong>{trimValue(selectedPlanDetails?.previousPlan?.planName)}</strong></div>
                        <div><span>Status</span><strong>{trimValue(selectedPlanDetails?.previousPlan?.status)}</strong></div>
                        <div><span>Start date</span><strong>{formatDateTime(selectedPlanDetails?.previousPlan?.startDate)}</strong></div>
                        <div><span>End date</span><strong>{formatDateTime(selectedPlanDetails?.previousPlan?.endDate)}</strong></div>
                      </div>
                    ) : (
                      <div className="plan-placeholder-inline">No previous plan found.</div>
                    )}
                  </section>

                  <section className="plan-section">
                    <h3>Upcoming plans</h3>
                    {Array.isArray(selectedPlanDetails?.upcomingPlans) && selectedPlanDetails.upcomingPlans.length ? (
                      <div className="plan-list">
                        {selectedPlanDetails.upcomingPlans.map((plan, index) => (
                          <article key={plan?._id || index} className="plan-list-item">
                            <strong>{trimValue(plan?.planName || plan?.plan?.name)}</strong>
                            <span>{trimValue(plan?.status)}</span>
                            <p>{formatPlanRange(plan?.startDate, plan?.endDate)}</p>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <div className="plan-placeholder-inline">No upcoming plans available.</div>
                    )}
                  </section>

                  <section className="plan-section">
                    <h3>Payment history</h3>
                    {Array.isArray(selectedPlanDetails?.payments) && selectedPlanDetails.payments.length ? (
                      <div className="payment-list">
                        {selectedPlanDetails.payments.map((payment) => (
                          <article key={payment?._id} className="payment-item">
                            <div className="payment-item-top">
                              <strong>{formatCurrency(payment?.amount)}</strong>
                              <span className="payment-status">{trimValue(payment?.status)}</span>
                            </div>
                            <div className="payment-meta">
                              <div><span>Method</span><strong>{trimValue(payment?.method)}</strong></div>
                              <div><span>Transaction</span><strong>{trimValue(payment?.transactionId)}</strong></div>
                              <div><span>Paid at</span><strong>{formatDateTime(payment?.paidAt || payment?.createdAt)}</strong></div>
                              <div><span>Wallet used</span><strong>{formatCurrency(payment?.walletUsed)}</strong></div>
                            </div>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <div className="plan-placeholder-inline">No payment history found.</div>
                    )}
                  </section>
                </>
              ) : (
                <div className="plan-placeholder">No subscription data available.</div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <style jsx>{`
        :root {
          --ink: #0f172a;
          --ink-muted: #52607a;
          --border: #e2e6ee;
          --surface: #ffffff;
          --surface-muted: #f6f8fb;
          --accent: #2653eb;
          --accent-soft: #eaf0ff;
          --success: #147a4a;
          --success-soft: #e5f6ec;
          --danger: #b3261e;
          --danger-soft: #fdecea;
        }

        .dash {
          min-height: 100svh;
          background: var(--surface-muted);
          color: var(--ink);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, sans-serif;
        }

        .dash-container {
          width: min(1280px, calc(100% - 2.5rem));
          margin: 0 auto;
          padding: 2rem 0 3rem;
        }

        .dash-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .dash-header h1 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 700;
          letter-spacing: -0.01em;
        }

        .dash-header p {
          margin: 0.3rem 0 0;
          color: var(--ink-muted);
          font-size: 0.92rem;
        }

        .btn-refresh {
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--ink);
          border-radius: 8px;
          padding: 0.6rem 1rem;
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
        }

        .btn-refresh:hover {
          border-color: var(--accent);
          color: var(--accent);
        }

        .btn-refresh:disabled {
          cursor: default;
          opacity: 0.6;
        }

        .error-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 0.9rem 1.1rem;
          border-radius: 10px;
          background: var(--danger-soft);
          border: 1px solid rgba(179, 38, 30, 0.2);
          margin-bottom: 1.5rem;
        }

        .error-banner strong {
          color: var(--danger);
        }

        .error-banner p {
          margin: 0.2rem 0 0;
          color: var(--ink-muted);
          font-size: 0.88rem;
        }

        .error-banner button {
          border: 1px solid rgba(179, 38, 30, 0.35);
          background: var(--surface);
          color: var(--danger);
          border-radius: 8px;
          padding: 0.55rem 0.9rem;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
        }

        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 0.9rem;
          margin-bottom: 1.5rem;
        }

        .kpi-card {
          text-align: left;
          display: grid;
          gap: 0.35rem;
          padding: 1rem 1.1rem;
          border-radius: 12px;
          border: 1px solid var(--border);
          background: var(--surface);
          font: inherit;
          color: inherit;
          cursor: default;
        }

        .kpi-clickable {
          cursor: pointer;
        }

        .kpi-clickable:hover {
          border-color: var(--accent);
        }

        .kpi-active {
          border-color: var(--accent);
          box-shadow: 0 0 0 1px var(--accent);
        }

        .kpi-label {
          font-size: 0.78rem;
          color: var(--ink-muted);
          font-weight: 600;
        }

        .kpi-value {
          font-size: 1.6rem;
          font-weight: 700;
          letter-spacing: -0.02em;
        }

        .kpi-hint {
          font-size: 0.78rem;
          color: var(--ink-muted);
        }

        .bucket-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.9rem;
          margin-bottom: 1.5rem;
        }

        .bucket-card {
          border: 1px solid var(--border);
          background: var(--surface);
          border-radius: 12px;
          padding: 1rem 1.1rem;
          cursor: pointer;
        }

        .bucket-card:hover {
          border-color: var(--accent);
        }

        .bucket-active {
          border-color: var(--accent);
          background: var(--accent-soft);
        }

        .bucket-card-top {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 0.75rem;
        }

        .bucket-title {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--ink);
        }

        .bucket-count {
          font-size: 1.3rem;
          font-weight: 700;
        }

        .bucket-actions {
          display: flex;
          gap: 0.5rem;
          margin-top: 0.85rem;
        }

        .bucket-actions button {
          flex: 1;
          border: 1px solid var(--border);
          background: var(--surface);
          border-radius: 7px;
          padding: 0.45rem 0.6rem;
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--ink);
          cursor: pointer;
        }

        .bucket-actions button.secondary {
          background: var(--surface-muted);
        }

        .bucket-actions button:hover {
          border-color: var(--accent);
          color: var(--accent);
        }

        .table-panel {
          border: 1px solid var(--border);
          background: var(--surface);
          border-radius: 14px;
          padding: 1.2rem;
        }

        .table-panel-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
        }

        .table-panel-head h2 {
          margin: 0;
          font-size: 1.1rem;
        }

        .table-panel-head p {
          margin: 0.25rem 0 0;
          color: var(--ink-muted);
          font-size: 0.86rem;
        }

        .row-count {
          white-space: nowrap;
          font-size: 0.82rem;
          color: var(--ink-muted);
          padding: 0.4rem 0.7rem;
          border-radius: 999px;
          background: var(--surface-muted);
          border: 1px solid var(--border);
        }

        .table-controls {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-end;
          justify-content: space-between;
          gap: 0.9rem;
          margin: 1rem 0;
        }

        .view-toggle {
          display: inline-flex;
          border: 1px solid var(--border);
          border-radius: 8px;
          overflow: hidden;
        }

        .view-toggle button {
          border: 0;
          background: var(--surface);
          padding: 0.5rem 1rem;
          font-size: 0.84rem;
          font-weight: 600;
          color: var(--ink-muted);
          cursor: pointer;
        }

        .view-toggle button.active {
          background: var(--accent);
          color: #fff;
        }

        .filter-row {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-end;
          gap: 0.6rem;
        }

        .filter-row label {
          display: grid;
          gap: 0.3rem;
        }

        .filter-row span {
          font-size: 0.74rem;
          font-weight: 600;
          color: var(--ink-muted);
        }

        .filter-row input {
          border: 1px solid var(--border);
          border-radius: 7px;
          padding: 0.5rem 0.6rem;
          font-size: 0.84rem;
          background: var(--surface);
          color: var(--ink);
        }

        .clear-filters {
          border: 1px solid var(--border);
          background: var(--surface-muted);
          border-radius: 7px;
          padding: 0.55rem 0.8rem;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          color: var(--ink);
        }

        .table-wrap {
          overflow-x: auto;
          border: 1px solid var(--border);
          border-radius: 10px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          min-width: 760px;
        }

        th, td {
          padding: 0.75rem 0.9rem;
          text-align: left;
          border-bottom: 1px solid var(--border);
          font-size: 0.86rem;
        }

        th {
          background: var(--surface-muted);
          font-size: 0.74rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--ink-muted);
          font-weight: 700;
        }

        tbody tr:hover td {
          background: var(--surface-muted);
        }

        .type-badge {
          display: inline-flex;
          align-items: center;
          padding: 0.25rem 0.6rem;
          border-radius: 999px;
          font-size: 0.76rem;
          font-weight: 600;
        }

        .type-otp {
          background: var(--accent-soft);
          color: var(--accent);
        }

        .type-registered {
          background: #fff4e0;
          color: #a5620a;
        }

        .type-plan {
          background: var(--success-soft);
          color: var(--success);
        }

        .cell-muted {
          color: var(--ink-muted);
        }

        .view-plan-btn {
          border: 1px solid var(--accent);
          background: var(--surface);
          color: var(--accent);
          border-radius: 7px;
          padding: 0.4rem 0.7rem;
          font-size: 0.78rem;
          font-weight: 700;
          cursor: pointer;
        }

        .view-plan-btn:hover {
          background: var(--accent);
          color: #fff;
        }

        .empty-state {
          padding: 2rem 1rem;
          text-align: center;
          color: var(--ink-muted);
          border: 1px dashed var(--border);
          border-radius: 10px;
          font-size: 0.88rem;
        }

        .plan-modal {
          width: 100%;
          height: 100%;
          background: var(--surface);
          border-radius: 16px;
          border: 1px solid var(--border);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .plan-modal-header {
          padding: 1rem 1.3rem;
          border-bottom: 1px solid var(--border);
        }

        .plan-modal-body {
          padding: 1.1rem 1.3rem 1.5rem;
          overflow-y: auto;
        }

        .plan-summary-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.9rem;
        }

        .plan-summary-card {
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 1rem;
          background: var(--surface-muted);
        }

        .plan-summary-card span {
          font-size: 0.74rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--ink-muted);
          font-weight: 700;
        }

        .plan-summary-card strong {
          display: block;
          margin: 0.4rem 0 0.3rem;
          font-size: 1.05rem;
        }

        .plan-summary-card p {
          margin: 0;
          color: var(--ink-muted);
          font-size: 0.84rem;
          line-height: 1.5;
        }

        .plan-detail-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.9rem;
          margin-top: 1rem;
        }

        .plan-section {
          margin-top: 1rem;
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 1rem;
        }

        .plan-section h3 {
          margin: 0 0 0.8rem;
          font-size: 0.95rem;
        }

        .plan-detail-list {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.7rem;
        }

        .plan-detail-list.two-col {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .plan-detail-list div {
          border: 1px solid var(--border);
          border-radius: 9px;
          padding: 0.7rem 0.8rem;
          background: var(--surface-muted);
        }

        .plan-detail-list span {
          display: block;
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--ink-muted);
          margin-bottom: 0.25rem;
          font-weight: 700;
        }

        .plan-detail-list strong {
          word-break: break-word;
          font-size: 0.9rem;
        }

        .plan-placeholder,
        .plan-placeholder-inline {
          border: 1px dashed var(--border);
          border-radius: 10px;
          padding: 1rem;
          color: var(--ink-muted);
          font-size: 0.88rem;
        }

        .plan-error {
          border-color: rgba(179, 38, 30, 0.3);
          background: var(--danger-soft);
          color: var(--danger);
        }

        .plan-list,
        .payment-list {
          display: grid;
          gap: 0.7rem;
        }

        .plan-list-item,
        .payment-item {
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 0.85rem;
          background: var(--surface-muted);
        }

        .plan-list-item p {
          margin: 0.35rem 0 0;
          color: var(--ink-muted);
          font-size: 0.84rem;
        }

        .payment-item-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.7rem;
        }

        .payment-status {
          padding: 0.25rem 0.6rem;
          border-radius: 999px;
          font-size: 0.74rem;
          font-weight: 700;
          background: var(--success-soft);
          color: var(--success);
        }

        .payment-meta {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.6rem;
        }

        .payment-meta div {
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 0.6rem 0.7rem;
          background: var(--surface);
        }

        .payment-meta div:last-child {
          grid-column: 1 / -1;
        }

        .payment-meta span {
          display: block;
          font-size: 0.72rem;
          text-transform: uppercase;
          color: var(--ink-muted);
          margin-bottom: 0.25rem;
          font-weight: 700;
        }

        @media (max-width: 1080px) {
          .kpi-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .bucket-grid {
            grid-template-columns: 1fr;
          }
          .plan-summary-grid,
          .plan-detail-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .kpi-grid {
            grid-template-columns: 1fr;
          }
          .dash-header {
            flex-direction: column;
          }
          .plan-detail-list {
            grid-template-columns: 1fr;
          }
          .payment-meta {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}