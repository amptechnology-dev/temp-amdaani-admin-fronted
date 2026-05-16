"use client";
import { useEffect, useState } from "react";
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
  if (typeof value !== "string") {
    return value ?? "-";
  }

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
  const year = target.getFullYear();
  const month = String(target.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
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

export default function Page() {
  const [dashboard, setDashboard] = useState(emptyDashboard);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedBucket, setSelectedBucket] = useState("registeredWithPlan");
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
          verifiedNotRegistered: safeSection(
            response?.data?.verifiedNotRegistered
          ),
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

  const openPlanDialog = async (user) => {
    const userId = user?._id || user?.userId;
    if (!userId) return;

    setSelectedPlanUser(user);
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

  const verifiedNotRegistered = dashboard.verifiedNotRegistered.data;
  const registeredNoPlan = dashboard.registeredNoPlan.data;
  const registeredWithPlan = dashboard.registeredWithPlan.data;

  const bucketDetails = {
    verifiedNotRegistered: {
      title: "OTP verify not register",
      subtitle: "Users who verified OTP but did not complete signup.",
      dateField: "otpVerifiedAt",
      overallItems: verifiedNotRegistered,
      todayItems: verifiedNotRegistered.filter((item) => isSameDay(item?.otpVerifiedAt)),
      emptyOverallText: "No OTP verify not register data right now.",
      emptyTodayText: "No OTP verify not register records found for today.",
      columns: ["Phone", "OTP verified at"],
      todayCount: dashboard.verifiedNotRegistered.todayCount,
      overallCount: dashboard.verifiedNotRegistered.count,
    },
    registeredNoPlan: {
      title: "Register but not take plan",
      subtitle: "Users who registered but have not taken any plan yet.",
      dateField: "createdAt",
      overallItems: registeredNoPlan,
      todayItems: registeredNoPlan.filter((item) => isSameDay(item?.createdAt)),
      emptyOverallText: "No register-but-not-plan data right now.",
      emptyTodayText: "No register-but-not-plan records found for today.",
      columns: ["Name", "Phone", "Email", "Created"],
      todayCount: dashboard.registeredNoPlan.todayCount,
      overallCount: dashboard.registeredNoPlan.count,
    },
    registeredWithPlan: {
      title: "Register with Plan",
      subtitle: "Users who registered and already have a plan.",
      dateField: "createdAt",
      overallItems: registeredWithPlan,
      todayItems: registeredWithPlan.filter((item) => isSameDay(item?.createdAt)),
      emptyOverallText: "No registered-with-plan data right now.",
      emptyTodayText: "No registered-with-plan records found for today.",
      columns: ["ID", "Name", "Phone", "Store", "Plan", "Created", "Action"],
      todayCount: dashboard.registeredWithPlan.todayCount,
      overallCount: dashboard.registeredWithPlan.count,
    },
  };

  const totalTracked =
    dashboard.verifiedNotRegistered.count +
    dashboard.registeredNoPlan.count +
    dashboard.registeredWithPlan.count;

  const todayTracked =
    dashboard.verifiedNotRegistered.todayCount +
    dashboard.registeredNoPlan.todayCount +
    dashboard.registeredWithPlan.todayCount;

  const planEligibleTotal =
    dashboard.registeredNoPlan.count + dashboard.registeredWithPlan.count;

  const planAdoption = planEligibleTotal
    ? Math.round((dashboard.registeredWithPlan.count / planEligibleTotal) * 100)
    : 0;

  const verificationShare = totalTracked
    ? Math.round((dashboard.verifiedNotRegistered.count / totalTracked) * 100)
    : 0;

  const activeStores = new Set(
    registeredWithPlan.map((item) => item?.store?._id).filter(Boolean)
  ).size;

  const latestVerification = [...verifiedNotRegistered].sort((a, b) => {
    const left = new Date(a?.otpVerifiedAt || 0).getTime();
    const right = new Date(b?.otpVerifiedAt || 0).getTime();
    return right - left;
  })[0];

  const latestPlanUser = [...registeredWithPlan].sort((a, b) => {
    const left = new Date(a?.createdAt || 0).getTime();
    const right = new Date(b?.createdAt || 0).getTime();
    return right - left;
  })[0];

  const summaryCards = [
    {
      key: "verifiedNotRegistered",
      title: "OTP verify not register",
      description: "Users who verified OTP but did not complete signup.",
      tone: "sky",
      value: bucketDetails.verifiedNotRegistered.overallCount,
      today: bucketDetails.verifiedNotRegistered.todayCount,
      percentage: verificationShare,
    },
    {
      key: "registeredNoPlan",
      title: "Register but not take plan",
      description: "Accounts that exist, but have not subscribed yet.",
      tone: "amber",
      value: bucketDetails.registeredNoPlan.overallCount,
      today: bucketDetails.registeredNoPlan.todayCount,
      percentage: planEligibleTotal
        ? Math.round((dashboard.registeredNoPlan.count / planEligibleTotal) * 100)
        : 0,
    },
    {
      key: "registeredWithPlan",
      title: "Register with Plan",
      description: "Fully onboarded users with an active store profile.",
      tone: "emerald",
      value: bucketDetails.registeredWithPlan.overallCount,
      today: bucketDetails.registeredWithPlan.todayCount,
      percentage: planAdoption,
    },
  ];

  const selectedBucketData = bucketDetails[selectedBucket] || bucketDetails.registeredWithPlan;
  const filteredOverallItems = selectedBucketData.overallItems.filter((item) => {
    const dateValue = item?.[selectedBucketData.dateField];

    return (
      isSameMonth(dateValue, selectedMonth) &&
      isSameDate(dateValue, selectedDate)
    );
  });

  const selectedItems = selectedView === "today" ? selectedBucketData.todayItems : filteredOverallItems;
  const selectedEmptyText =
    selectedView === "today"
      ? selectedBucketData.emptyTodayText
      : selectedMonth || selectedDate
        ? "No records match the selected date filter."
        : selectedBucketData.emptyOverallText;
  const showTodayVerifiedList = selectedBucket === "verifiedNotRegistered" && selectedView === "today";

  return (
    <main className="dashboard-shell">
      <div className="dashboard-orb dashboard-orb-a" />
      <div className="dashboard-orb dashboard-orb-b" />

      <div className="dashboard-frame">
        <header className="hero-card">
          <div className="hero-copy">
            <div className="hero-pill-row">
              <span className="hero-pill hero-pill-live">
                <span className="hero-pill-dot" /> Live dashboard
              </span>
              <span className="hero-pill hero-pill-muted">
                Synced from /dashboard/tracking-dashboard
              </span>
            </div>

            <h1>A vibrant command center for onboarding and growth.</h1>
            <p>
              Track onboarding progress, verify funnel health, and drill into any
              bucket by clicking a card to reveal its data table.
            </p>

            <div className="hero-metric-row">
              <div className="hero-metric">
                <span>Total tracked</span>
                <strong>{loading ? "—" : formatNumber(totalTracked)}</strong>
              </div>
              <div className="hero-metric">
                <span>Today&apos;s registered users</span>
                <strong>{loading ? "—" : formatNumber(todayTracked)}</strong>
              </div>
              <div className="hero-metric">
                <span>Active stores</span>
                <strong>{loading ? "—" : formatNumber(activeStores)}</strong>
              </div>
              <div className="hero-metric">
                <span>Plan adoption</span>
                <strong>{loading ? "—" : `${planAdoption}%`}</strong>
              </div>
            </div>
          </div>

          <aside className="hero-panel">
            <span className="hero-panel-label">Today registered users</span>
            <div className="hero-panel-value">{loading ? "Loading…" : `${dashboard.registeredWithPlan.todayCount}`}</div>
            <p>
              {loading
                ? "Pulling the latest analytics from the API."
                : `Click the cards below to switch the table view. ${planAdoption}% of eligible users are already on a plan.`}
            </p>

            <div className="hero-panel-stack">
              <div>
                <span>Latest OTP verification</span>
                <strong>
                  {loading
                    ? "—"
                    : formatDateTime(latestVerification?.otpVerifiedAt)}
                </strong>
              </div>
              <div>
                <span>Latest onboarded user</span>
                <strong>
                  {loading
                    ? "—"
                    : trimValue(latestPlanUser?.name || latestPlanUser?.amdaaniId)}
                </strong>
              </div>
            </div>
          </aside>
        </header>

        <section className="summary-grid">
          {summaryCards.map((card) => (
            <article
              key={card.key}
              role="button"
              tabIndex={0}
              onClick={() => {
                setSelectedBucket(card.key);
                setSelectedView("overall");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setSelectedBucket(card.key);
                  setSelectedView("overall");
                }
              }}
              className={`summary-card summary-card-${card.tone} ${selectedBucket === card.key ? "summary-card-active" : ""}`}
            >
              <div className="summary-topline">
                <span>{card.title}</span>
                <strong>{loading ? "—" : `${card.percentage}%`}</strong>
              </div>

              <div className="summary-value-row">
                <div>
                  <span>Current count</span>
                  <strong>{loading ? "—" : formatNumber(card.value)}</strong>
                </div>
                <div>
                  <span>Today</span>
                  <strong>{loading ? "—" : formatNumber(card.today)}</strong>
                </div>
              </div>

              <p>{card.description}</p>

              <div className="card-action-row">
                <button
                  type="button"
                  className="card-action"
                  onClick={(event) => {
                    event.stopPropagation();
                    setSelectedBucket(card.key);
                    setSelectedView("today");
                  }}
                >
                  Today {formatNumber(card.today)}
                </button>
                <button
                  type="button"
                  className="card-action secondary"
                  onClick={(event) => {
                    event.stopPropagation();
                    setSelectedBucket(card.key);
                    setSelectedView("overall");
                  }}
                >
                  Overall {formatNumber(card.value)}
                </button>
              </div>

              <div className="progress-rail" aria-hidden="true">
                <span
                  className="progress-fill"
                  style={{ width: loading ? "18%" : `${Math.min(card.percentage, 100)}%` }}
                />
              </div>
            </article>
          ))}
        </section>

        {error ? (
          <section className="error-panel" role="alert">
            <div>
              <strong>Dashboard unavailable</strong>
              <p>{error}</p>
            </div>
            <button type="button" onClick={fetchDashboard}>
              Retry
            </button>
          </section>
        ) : null}

        <section className="detail-panel">
          <div className="panel-heading detail-heading">
            <div>
              <span className="panel-kicker">Selected table</span>
              <h2>{selectedBucketData.title}</h2>
              <p>
                {selectedBucketData.subtitle} {selectedView === "today" ? "Showing today only." : "Showing overall report."}
              </p>
              {showTodayVerifiedList ? (
                <button
                  type="button"
                  className="inline-link"
                  onClick={() => setSelectedView("overall")}
                >
                  Show overall OTP verify not register records
                </button>
              ) : null}

              {selectedView === "overall" ? (
                <div className="filter-row">
                  <label className="filter-field">
                    <span>Month filter</span>
                    <input
                      type="month"
                      value={selectedMonth}
                      onChange={(event) => setSelectedMonth(event.target.value)}
                    />
                  </label>

                  <label className="filter-field">
                    <span>Date filter</span>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(event) => setSelectedDate(event.target.value)}
                    />
                  </label>

                  <button
                    type="button"
                    className="filter-clear"
                    onClick={() => {
                      setSelectedMonth("");
                      setSelectedDate("");
                    }}
                  >
                    Clear filters
                  </button>
                </div>
              ) : null}
            </div>
            <span className="panel-count">
              {loading ? "Loading…" : `${formatNumber(selectedItems.length)} rows`}
            </span>
          </div>

          {selectedItems.length ? (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    {selectedBucketData.columns.map((column) => (
                      <th key={column}>{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectedBucket === "verifiedNotRegistered" &&
                    selectedItems.map((item) => (
                      <tr key={`${item?.phone}-${item?.otpVerifiedAt}`}>
                        <td>{trimValue(item?.phone)}</td>
                        <td>{formatDateTime(item?.otpVerifiedAt)}</td>
                      </tr>
                    ))}

                  {selectedBucket === "registeredNoPlan" &&
                    selectedItems.map((item) => (
                      <tr key={item?._id || item?.phone}>
                        <td>{trimValue(item?.name || "-")}</td>
                        <td>{trimValue(item?.phone)}</td>
                        <td>{trimValue(item?.email)}</td>
                        <td>{formatDateTime(item?.createdAt)}</td>
                      </tr>
                    ))}

                  {selectedBucket === "registeredWithPlan" &&
                    selectedItems.map((item) => {
                      const store = item?.store || {};
                      const userId = trimValue(item?.amdaaniId || item?._id);

                      return (
                        <tr key={item?._id || userId}>
                          <td>{userId}</td>
                          <td>{trimValue(item?.name)}</td>
                          <td>{trimValue(item?.phone)}</td>
                          <td>{trimValue(store?.name)}</td>
                          <td>
                            <span className="table-pill table-pill-success">
                              Active Plan
                            </span>
                          </td>
                          <td>{formatDateTime(item?.createdAt)}</td>
                          <td>
                            <button
                              type="button"
                              className="view-plan-button"
                              onClick={() => openPlanDialog(item)}
                            >
                              View Plan
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state table-empty">
              <strong>{selectedEmptyText}</strong>
              <p>Click Today or Overall on any card to switch the table view.</p>
            </div>
          )}

          <div className="bottom-grid">
            <article className="panel accent-panel">
              <span className="panel-kicker">Operational snapshot</span>
              <h3>Today registered user</h3>
              <strong>{loading ? "—" : formatNumber(dashboard.registeredWithPlan.todayCount)}</strong>
              <p>Selected by default so the page opens on the most valuable bucket.</p>
            </article>

            <article className="panel accent-panel alt">
              <span className="panel-kicker">Funnel health</span>
              <h3>Plan adoption</h3>
              <strong>{loading ? "—" : `${planAdoption}%`}</strong>
              <p>Shows how many eligible users already moved to a paid plan.</p>
            </article>
          </div>
        </section>
      </div>

      <Dialog open={planDialogOpen} onOpenChange={(nextOpen) => (nextOpen ? setPlanDialogOpen(true) : closePlanDialog())}>
        <DialogContent className="plan-dialog-content !h-[92vh] !max-h-[92vh] !w-[96vw] !max-w-[96vw] overflow-hidden border-0 bg-transparent p-0 shadow-none sm:!w-[92vw] sm:!max-w-[92vw] lg:!w-[88vw] lg:!max-w-[88vw]">
          <div className="plan-modal-shell">
            <DialogHeader className="plan-modal-header sr-only">
              <DialogTitle>
                {selectedPlanUser?.name || selectedPlanUser?.amdaaniId || "Subscription details"}
              </DialogTitle>
            </DialogHeader>

            <div className="plan-modal-body">
              {planLoading ? (
                <div className="plan-empty-state">Loading plan details...</div>
              ) : planError ? (
                <div className="plan-empty-state error">
                  <strong>Unable to load subscription</strong>
                  <p>{planError}</p>
                </div>
              ) : selectedPlanDetails ? (
                <>
                  <div className="plan-hero-grid">
                    <article className="plan-hero-card accent-a">
                      <span>Current Plan</span>
                      <strong>{trimValue(selectedPlanDetails?.currentPlan?.planName)}</strong>
                      <p>{trimValue(selectedPlanDetails?.currentPlan?.plan?.description)}</p>
                    </article>
                    <article className="plan-hero-card accent-b">
                      <span>Expiry Date</span>
                      <strong>{formatDateTime(selectedPlanDetails?.currentPlan?.endDate)}</strong>
                      <p>{formatPlanRange(selectedPlanDetails?.currentPlan?.startDate, selectedPlanDetails?.currentPlan?.endDate)}</p>
                    </article>
                    <article className="plan-hero-card accent-c">
                      <span>Payment Count</span>
                      <strong>{formatNumber(selectedPlanDetails?.payments?.length || 0)}</strong>
                      <p>Successful payment history linked to this account.</p>
                    </article>
                  </div>

                  <div className="plan-detail-grid">
                    <section className="plan-section">
                      <div className="plan-section-head">
                        <h3>User & Store</h3>
                      </div>
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
                      <div className="plan-section-head">
                        <h3>Current Plan</h3>
                      </div>
                      <div className="plan-detail-list">
                        <div><span>Plan Name</span><strong>{trimValue(selectedPlanDetails?.currentPlan?.planName)}</strong></div>
                        <div><span>Status</span><strong>{trimValue(selectedPlanDetails?.currentPlan?.status)}</strong></div>
                        <div><span>Price</span><strong>{formatCurrency(selectedPlanDetails?.currentPlan?.price)}</strong></div>
                        <div><span>Duration</span><strong>{formatNumber(selectedPlanDetails?.currentPlan?.durationDays)} days</strong></div>
                        <div><span>Start Date</span><strong>{formatDateTime(selectedPlanDetails?.currentPlan?.startDate)}</strong></div>
                        <div><span>End Date</span><strong>{formatDateTime(selectedPlanDetails?.currentPlan?.endDate)}</strong></div>
                      </div>
                    </section>
                  </div>

                  <section className="plan-section">
                    <div className="plan-section-head">
                      <h3>Previous Plan</h3>
                    </div>
                    {selectedPlanDetails?.previousPlan ? (
                      <div className="plan-detail-list two-col">
                        <div><span>Plan Name</span><strong>{trimValue(selectedPlanDetails?.previousPlan?.planName)}</strong></div>
                        <div><span>Status</span><strong>{trimValue(selectedPlanDetails?.previousPlan?.status)}</strong></div>
                        <div><span>Start Date</span><strong>{formatDateTime(selectedPlanDetails?.previousPlan?.startDate)}</strong></div>
                        <div><span>End Date</span><strong>{formatDateTime(selectedPlanDetails?.previousPlan?.endDate)}</strong></div>
                      </div>
                    ) : (
                      <div className="plan-empty-inline">No previous plan found.</div>
                    )}
                  </section>

                  <section className="plan-section">
                    <div className="plan-section-head">
                      <h3>Upcoming Plans</h3>
                    </div>
                    {Array.isArray(selectedPlanDetails?.upcomingPlans) && selectedPlanDetails.upcomingPlans.length ? (
                      <div className="plan-card-list">
                        {selectedPlanDetails.upcomingPlans.map((plan, index) => (
                          <article key={plan?._id || index} className="plan-small-card">
                            <strong>{trimValue(plan?.planName || plan?.plan?.name)}</strong>
                            <span>{trimValue(plan?.status)}</span>
                            <p>{formatPlanRange(plan?.startDate, plan?.endDate)}</p>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <div className="plan-empty-inline">No upcoming plans available.</div>
                    )}
                  </section>

                  <section className="plan-section">
                    <div className="plan-section-head">
                      <h3>Payment History</h3>
                    </div>
                    {Array.isArray(selectedPlanDetails?.payments) && selectedPlanDetails.payments.length ? (
                      <div className="payment-list">
                        {selectedPlanDetails.payments.map((payment) => (
                          <article key={payment?._id} className="payment-card">
                            <div className="payment-row">
                              <strong>{formatCurrency(payment?.amount)}</strong>
                              <span className="payment-status success">{trimValue(payment?.status)}</span>
                            </div>
                            <div className="payment-meta-grid">
                              <div><span>Method</span><strong>{trimValue(payment?.method)}</strong></div>
                              <div><span>Transaction</span><strong>{trimValue(payment?.transactionId)}</strong></div>
                              <div><span>Paid At</span><strong>{formatDateTime(payment?.paidAt || payment?.createdAt)}</strong></div>
                              <div><span>Wallet Used</span><strong>{formatCurrency(payment?.walletUsed)}</strong></div>
                            </div>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <div className="plan-empty-inline">No payment history found.</div>
                    )}
                  </section>
                </>
              ) : (
                <div className="plan-empty-state">No subscription data available.</div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <style jsx>{`
        .dashboard-shell {
          position: relative;
          min-height: 100svh;
          overflow: hidden;
          background:
            radial-gradient(circle at top left, rgba(255, 190, 11, 0.22), transparent 30%),
            radial-gradient(circle at top right, rgba(56, 189, 248, 0.22), transparent 28%),
            radial-gradient(circle at bottom left, rgba(236, 72, 153, 0.16), transparent 28%),
            linear-gradient(180deg, #fffaf2 0%, #f4fbff 48%, #eefaf4 100%);
          color: #12324a;
        }

        .dashboard-orb {
          position: absolute;
          border-radius: 999px;
          filter: blur(8px);
          opacity: 0.75;
          pointer-events: none;
        }

        .dashboard-orb-a {
          top: -8rem;
          left: -4rem;
          width: 22rem;
          height: 22rem;
          background: radial-gradient(circle, rgba(250, 204, 21, 0.35), transparent 72%);
        }

        .dashboard-orb-b {
          right: -6rem;
          top: 8rem;
          width: 18rem;
          height: 18rem;
          background: radial-gradient(circle, rgba(34, 197, 94, 0.26), transparent 70%);
        }

        .dashboard-frame {
          position: relative;
          z-index: 1;
          width: min(1440px, calc(100% - 2rem));
          margin: 0 auto;
          padding: 1.25rem 0 2rem;
        }

        .hero-card,
        .summary-card,
        .panel,
        .error-panel {
          border: 1px solid rgba(130, 149, 170, 0.16);
          box-shadow: 0 18px 45px rgba(32, 63, 92, 0.12);
          backdrop-filter: blur(10px);
        }

        .hero-card {
          display: grid;
          grid-template-columns: minmax(0, 1.7fr) minmax(300px, 0.9fr);
          gap: 1rem;
          padding: 1.3rem;
          border-radius: 28px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 249, 237, 0.92));
        }

        .hero-copy h1 {
          margin: 1rem 0 0.7rem;
          max-width: 14ch;
          font-size: clamp(2.2rem, 4vw, 4.5rem);
          line-height: 0.95;
          letter-spacing: -0.05em;
          color: #0f2f46;
        }

        .hero-copy p {
          max-width: 60ch;
          margin: 0;
          color: rgba(30, 64, 92, 0.78);
          font-size: 1rem;
          line-height: 1.7;
        }

        .hero-pill-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.65rem;
          align-items: center;
        }

        .hero-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.5rem 0.85rem;
          border-radius: 999px;
          font-size: 0.78rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          border: 1px solid rgba(130, 149, 170, 0.18);
        }

        .hero-pill-live {
          color: #0f766e;
          background: rgba(45, 212, 191, 0.18);
        }

        .hero-pill-muted {
          color: rgba(15, 47, 70, 0.82);
          background: rgba(255, 255, 255, 0.76);
        }

        .hero-pill-dot {
          width: 0.45rem;
          height: 0.45rem;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.55);
          animation: pulse 1.8s infinite;
        }

        .hero-metric-row {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 0.8rem;
          margin-top: 1.25rem;
        }

        .hero-metric {
          padding: 0.95rem 1rem;
          border-radius: 20px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(250, 253, 255, 0.98));
          border: 1px solid rgba(148, 163, 184, 0.14);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
        }

        .hero-metric span,
        .hero-panel-label,
        .panel-kicker,
        .summary-card p,
        .record-meta-grid span,
        .mini-row span,
        .snapshot-grid span,
        .empty-state p,
        .hero-panel p,
        .summary-topline span,
        .summary-value-row span,
        .detail-heading p,
        .accent-panel p {
          color: rgba(57, 82, 104, 0.76);
        }

        .hero-metric strong,
        .hero-panel-value,
        .summary-topline strong,
        .summary-value-row strong,
        .panel-count,
        .record-id,
        .record-card h3,
        .record-meta-grid strong,
        .mini-row strong,
        .snapshot-grid strong,
        .empty-state strong,
        .detail-heading h2,
        .accent-panel strong {
          color: #0c2941;
        }

        .hero-metric strong {
          display: block;
          margin-top: 0.4rem;
          font-size: 1.5rem;
          letter-spacing: -0.04em;
          color: #0c2941;
        }

        .hero-panel {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 1.1rem;
          border-radius: 24px;
          background:
            linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(228, 252, 245, 0.94)),
            radial-gradient(circle at top right, rgba(56, 189, 248, 0.16), transparent 50%);
          border: 1px solid rgba(148, 163, 184, 0.16);
        }

        .hero-panel-value {
          margin: 0.5rem 0;
          font-size: clamp(2.3rem, 4vw, 3.8rem);
          line-height: 1;
          letter-spacing: -0.06em;
          color: #0f766e;
        }

        .hero-panel p {
          margin: 0;
          line-height: 1.7;
        }

        .hero-panel-stack {
          display: grid;
          gap: 0.75rem;
          margin-top: 1rem;
        }

        .hero-panel-stack div {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 0.88rem 1rem;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.82);
          border: 1px solid rgba(148, 163, 184, 0.12);
        }

        .hero-panel-stack span,
        .hero-panel-stack strong {
          font-size: 0.92rem;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 1rem;
          margin-top: 1rem;
        }

        .summary-card {
          position: relative;
          overflow: hidden;
          border-radius: 24px;
          padding: 1.1rem;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(250, 251, 255, 0.95));
        }

        .card-action-row {
          position: relative;
          z-index: 1;
          display: flex;
          flex-wrap: wrap;
          gap: 0.6rem;
          margin-top: 0.85rem;
        }

        .card-action {
          border: 0;
          cursor: pointer;
          padding: 0.72rem 0.95rem;
          border-radius: 999px;
          color: #fff;
          background: linear-gradient(135deg, #06b6d4, #8b5cf6);
          font-weight: 700;
          box-shadow: 0 12px 24px rgba(59, 130, 246, 0.18);
        }

        .card-action.secondary {
          background: linear-gradient(135deg, #f59e0b, #ef4444);
        }

        .view-plan-button {
          border: 0;
          cursor: pointer;
          padding: 0.7rem 0.95rem;
          border-radius: 999px;
          color: #fff;
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          font-weight: 700;
          box-shadow: 0 12px 24px rgba(59, 130, 246, 0.18);
        }

        .filter-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          margin-top: 0.85rem;
        }

        .filter-field {
          display: grid;
          gap: 0.35rem;
          min-width: 180px;
        }

        .filter-field span {
          font-size: 0.74rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(57, 82, 104, 0.76);
        }

        .filter-field input {
          width: 100%;
          border: 1px solid rgba(148, 163, 184, 0.22);
          border-radius: 14px;
          padding: 0.8rem 0.9rem;
          background: rgba(255, 255, 255, 0.95);
          color: #17324a;
          outline: none;
        }

        .filter-field input:focus {
          border-color: rgba(59, 130, 246, 0.45);
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.12);
        }

        .filter-clear {
          align-self: end;
          border: 1px solid rgba(148, 163, 184, 0.22);
          background: rgba(255, 255, 255, 0.92);
          color: #0f2f46;
          border-radius: 999px;
          padding: 0.8rem 1rem;
          font-weight: 700;
          cursor: pointer;
        }

        .summary-card::before {
          content: "";
          position: absolute;
          inset: auto -25% -35% auto;
          width: 8rem;
          height: 8rem;
          border-radius: 999px;
          filter: blur(4px);
          opacity: 0.28;
        }

        .summary-card-sky::before {
          background: radial-gradient(circle, rgba(56, 189, 248, 0.9), transparent 65%);
        }

        .summary-card-amber::before {
          background: radial-gradient(circle, rgba(245, 158, 11, 0.95), transparent 65%);
        }

        .summary-card-emerald::before {
          background: radial-gradient(circle, rgba(16, 185, 129, 0.95), transparent 65%);
        }

        .summary-topline,
        .summary-value-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .summary-topline strong {
          font-size: 1.3rem;
          letter-spacing: -0.04em;
          color: #0f766e;
        }

        .summary-card p {
          margin: 0.9rem 0 1rem;
          line-height: 1.6;
        }

        .summary-value-row div {
          display: grid;
          gap: 0.25rem;
        }

        .summary-value-row strong {
          font-size: 1.25rem;
          letter-spacing: -0.03em;
          color: #0c2941;
        }

        .progress-rail {
          margin-top: 1rem;
          height: 0.42rem;
          border-radius: 999px;
          background: rgba(148, 163, 184, 0.12);
          overflow: hidden;
        }

        .progress-fill {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, rgba(59, 130, 246, 1), rgba(168, 85, 247, 1), rgba(34, 197, 94, 1));
          box-shadow: 0 0 18px rgba(59, 130, 246, 0.28);
        }

        .error-panel {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          margin-top: 1rem;
          padding: 1rem 1.1rem;
          border-radius: 22px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.97), rgba(255, 245, 247, 0.96));
        }

        .error-panel p {
          margin: 0.35rem 0 0;
          color: rgba(57, 82, 104, 0.82);
        }

        .error-panel button {
          border: 0;
          cursor: pointer;
          padding: 0.85rem 1.1rem;
          border-radius: 999px;
          color: #fff;
          background: linear-gradient(135deg, #06b6d4, #8b5cf6);
          font-weight: 700;
        }

        .detail-panel {
          display: grid;
          gap: 1rem;
          margin-top: 1rem;
        }

        .panel {
          border-radius: 26px;
          padding: 1.1rem;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(246, 250, 255, 0.95));
        }

        .panel h2,
        .panel h3,
        .panel strong,
        .detail-heading h2 {
          color: #0c2941;
        }

        .panel-stack {
          display: grid;
          gap: 1rem;
        }

        .panel-heading {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .panel-heading.compact {
          margin-bottom: 0.85rem;
        }

        .panel-heading h2 {
          margin: 0.25rem 0 0;
          font-size: 1.35rem;
          letter-spacing: -0.03em;
        }

        .panel-kicker {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          font-size: 0.76rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #06b6d4;
        }

        .panel-count {
          white-space: nowrap;
          padding: 0.5rem 0.85rem;
          border-radius: 999px;
          font-size: 0.86rem;
          background: rgba(255, 255, 255, 0.88);
          border: 1px solid rgba(148, 163, 184, 0.16);
        }

        .record-list {
          display: grid;
          gap: 0.9rem;
        }

        .record-card {
          padding: 1rem;
          border-radius: 22px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(249, 252, 255, 0.95));
          border: 1px solid rgba(148, 163, 184, 0.14);
        }

        .record-card-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
        }

        .record-card h3 {
          margin: 0.3rem 0 0.35rem;
          font-size: 1.1rem;
          letter-spacing: -0.03em;
        }

        .record-card p {
          margin: 0;
          color: rgba(57, 82, 104, 0.75);
        }

        .record-id {
          display: inline-flex;
          align-items: center;
          padding: 0.3rem 0.65rem;
          border-radius: 999px;
          background: rgba(59, 130, 246, 0.12);
          border: 1px solid rgba(59, 130, 246, 0.2);
          font-size: 0.8rem;
          letter-spacing: 0.08em;
          color: #2563eb;
        }

        .record-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          justify-content: flex-end;
        }

        .status-chip,
        .mini-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          padding: 0.4rem 0.72rem;
          font-size: 0.76rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .status-chip {
          border: 1px solid rgba(148, 163, 184, 0.14);
          background: rgba(255, 255, 255, 0.88);
        }

        .status-chip-success {
          color: #15803d;
        }

        .status-chip-warn {
          color: #b45309;
        }

        .status-chip-muted {
          color: #475569;
        }

        .record-meta-grid,
        .snapshot-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.8rem;
          margin-top: 1rem;
        }

        .record-meta-grid div,
        .snapshot-grid div {
          padding: 0.85rem 0.9rem;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(148, 163, 184, 0.12);
        }

        .record-meta-grid span,
        .snapshot-grid span {
          display: block;
          margin-bottom: 0.35rem;
          font-size: 0.74rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .record-meta-grid strong,
        .snapshot-grid strong {
          display: block;
          line-height: 1.45;
          word-break: break-word;
        }

        .mini-list {
          display: grid;
          gap: 0.75rem;
        }

        .mini-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 0.85rem 0.95rem;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(148, 163, 184, 0.12);
        }

        .mini-row div {
          display: grid;
          gap: 0.3rem;
        }

        .mini-row strong {
          font-size: 0.98rem;
        }

        .mini-row span {
          font-size: 0.86rem;
          line-height: 1.45;
        }

        .mini-pill {
          color: #ffffff;
          background: linear-gradient(135deg, #22c55e, #0ea5e9);
          flex-shrink: 0;
        }

        .mini-pill.warning {
          background: linear-gradient(135deg, #f59e0b, #fb7185);
        }

        .table-wrap {
          overflow-x: auto;
          border-radius: 22px;
          border: 1px solid rgba(148, 163, 184, 0.14);
          background: rgba(255, 255, 255, 0.92);
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 760px;
        }

        .data-table th,
        .data-table td {
          padding: 1rem 1rem;
          border-bottom: 1px solid rgba(226, 232, 240, 1);
          text-align: left;
          vertical-align: top;
          color: #17324a;
        }

        .data-table th {
          background: linear-gradient(135deg, rgba(236, 254, 255, 1), rgba(240, 249, 255, 1));
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #0f766e;
        }

        .data-table tr:hover td {
          background: rgba(245, 250, 255, 0.92);
        }

        .table-pill {
          display: inline-flex;
          align-items: center;
          padding: 0.35rem 0.7rem;
          border-radius: 999px;
          font-size: 0.78rem;
          font-weight: 700;
        }

        .table-pill-success {
          color: #166534;
          background: rgba(220, 252, 231, 1);
        }

        .plan-modal-shell {
          width: 100%;
          height: 100%;
          max-height: 92vh;
          overflow: hidden;
          border-radius: 28px;
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(245, 251, 255, 0.98));
          box-shadow: 0 30px 80px rgba(15, 23, 42, 0.25);
        }

        .plan-modal-header {
          padding: 0.4rem 1.2rem 0;
          border-bottom: 1px solid rgba(148, 163, 184, 0.16);
        }

        .plan-modal-body {
          height: calc(92vh - 92px);
          max-height: calc(92vh - 92px);
          overflow-y: auto;
          padding: 1.1rem 1.2rem 1.2rem;
        }

        .plan-hero-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 1rem;
        }

        .plan-hero-card {
          padding: 1.15rem;
          border-radius: 24px;
          color: #fff;
          min-height: 170px;
          display: grid;
          align-content: space-between;
        }

        .plan-hero-card span {
          font-size: 0.74rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          opacity: 0.88;
        }

        .plan-hero-card strong {
          font-size: 1.25rem;
          line-height: 1.2;
        }

        .plan-hero-card p {
          margin: 0;
          opacity: 0.92;
          line-height: 1.5;
        }

        .accent-a {
          background: linear-gradient(135deg, #0ea5e9, #2563eb);
        }

        .accent-b {
          background: linear-gradient(135deg, #8b5cf6, #ec4899);
        }

        .accent-c {
          background: linear-gradient(135deg, #22c55e, #14b8a6);
        }

        .plan-detail-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 1rem;
          margin-top: 1rem;
        }

        .plan-section {
          margin-top: 1rem;
          padding: 1.1rem;
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(148, 163, 184, 0.14);
        }

        .plan-section-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 0.8rem;
        }

        .plan-section h3 {
          margin: 0;
          font-size: 1rem;
          color: #0c2941;
        }

        .plan-detail-list {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.9rem;
        }

        .plan-detail-list.two-col {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .plan-detail-list div,
        .plan-card-list,
        .payment-card {
          padding: 1rem;
          border-radius: 18px;
          background: linear-gradient(135deg, rgba(248, 250, 252, 0.96), rgba(255, 255, 255, 1));
          border: 1px solid rgba(148, 163, 184, 0.12);
        }

        .plan-detail-list span,
        .payment-meta-grid span,
        .plan-small-card span {
          display: block;
          margin-bottom: 0.35rem;
          font-size: 0.74rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(57, 82, 104, 0.76);
        }

        .plan-detail-list strong,
        .payment-meta-grid strong,
        .plan-small-card strong {
          color: #0c2941;
          word-break: break-word;
        }

        .plan-empty-inline,
        .plan-empty-state {
          padding: 1.1rem;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.92);
          border: 1px dashed rgba(148, 163, 184, 0.22);
          color: #0f2f46;
        }

        .plan-empty-state.error {
          background: rgba(255, 247, 237, 0.96);
        }

        .plan-card-list,
        .payment-list {
          display: grid;
          gap: 0.9rem;
        }

        .plan-small-card {
          padding: 1rem;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.96);
          border: 1px solid rgba(148, 163, 184, 0.12);
        }

        .plan-small-card p {
          margin: 0.45rem 0 0;
          color: rgba(57, 82, 104, 0.76);
        }

        .payment-card {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(240, 249, 255, 0.95));
        }

        .payment-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .payment-row strong {
          font-size: 1.1rem;
          color: #0c2941;
        }

        .payment-status {
          display: inline-flex;
          align-items: center;
          padding: 0.35rem 0.7rem;
          border-radius: 999px;
          font-size: 0.76rem;
          font-weight: 700;
          text-transform: uppercase;
        }

        .payment-status.success {
          background: rgba(220, 252, 231, 1);
          color: #166534;
        }

        .payment-meta-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.9rem;
        }

        .payment-meta-grid div {
          padding: 0.9rem;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(148, 163, 184, 0.1);
        }

        .payment-meta-grid div:last-child {
          grid-column: 1 / -1;
        }

        .view-plan-button {
          border: 0;
          cursor: pointer;
          padding: 0.7rem 0.95rem;
          border-radius: 999px;
          color: #fff;
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          font-weight: 700;
          box-shadow: 0 12px 24px rgba(59, 130, 246, 0.18);
        }

        @media (max-width: 900px) {
          .plan-hero-grid,
          .plan-detail-grid,
          .plan-detail-list {
            grid-template-columns: 1fr;
          }

          .payment-meta-grid,
          .plan-detail-list.two-col {
            grid-template-columns: 1fr;
          }

          .plan-modal-body {
            height: auto;
            max-height: calc(92vh - 92px);
          }
        }

        .table-pill-warning {
          color: #92400e;
          background: rgba(254, 243, 199, 1);
        }

        .table-empty {
          margin-top: 0;
        }

        .detail-heading {
          margin-bottom: 0;
        }

        .detail-heading p {
          margin: 0.3rem 0 0;
        }

        .inline-link {
          margin-top: 0.45rem;
          padding: 0;
          border: 0;
          background: transparent;
          color: #2563eb;
          font-weight: 700;
          cursor: pointer;
        }

        .summary-card-active {
          border-color: rgba(59, 130, 246, 0.34);
          box-shadow: 0 18px 45px rgba(37, 99, 235, 0.14);
          transform: translateY(-3px);
        }

        .accent-panel {
          background: linear-gradient(135deg, rgba(224, 242, 254, 0.96), rgba(240, 253, 244, 0.96));
        }

        .accent-panel.alt {
          background: linear-gradient(135deg, rgba(255, 247, 237, 0.96), rgba(255, 241, 242, 0.96));
        }

        .accent-panel h3 {
          margin: 0.5rem 0;
          font-size: 1.1rem;
        }

        .accent-panel strong {
          display: block;
          margin: 0.35rem 0 0.4rem;
          font-size: 2rem;
        }

        .bottom-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 1rem;
          margin-top: 1rem;
        }

        .snapshot-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          margin-top: 0;
        }

        .empty-state {
          display: grid;
          gap: 0.45rem;
          padding: 1.1rem;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.92);
          border: 1px dashed rgba(148, 163, 184, 0.22);
        }

        .empty-state.compact {
          min-height: 118px;
          align-content: center;
        }

        .empty-state strong {
          font-size: 1rem;
        }

        .empty-state p {
          margin: 0;
          line-height: 1.6;
        }

        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.5);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(52, 211, 153, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(52, 211, 153, 0);
          }
        }

        @media (max-width: 1180px) {
          .hero-card,
          .bottom-grid {
            grid-template-columns: 1fr;
          }

          .summary-grid {
            grid-template-columns: 1fr;
          }

          .record-meta-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 760px) {
          .dashboard-frame {
            width: min(100%, calc(100% - 1rem));
            padding-top: 0.75rem;
          }

          .hero-card,
          .panel,
          .summary-card,
          .error-panel {
            border-radius: 22px;
          }

          .hero-metric-row,
          .record-meta-grid,
          .snapshot-grid {
            grid-template-columns: 1fr;
          }

          .hero-metric-row {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .record-card-head,
          .mini-row,
          .panel-heading,
          .error-panel,
          .detail-heading {
            flex-direction: column;
            align-items: flex-start;
          }

          .record-badges {
            justify-content: flex-start;
          }

          .hero-copy h1 {
            max-width: 100%;
          }
        }

        @media (max-width: 520px) {
          .hero-metric-row {
            grid-template-columns: 1fr;
          }

          .hero-pill-row {
            align-items: flex-start;
          }

          .bottom-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}
