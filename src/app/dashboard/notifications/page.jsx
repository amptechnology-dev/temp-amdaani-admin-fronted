"use client";

import * as React from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	PlusCircle,
	RefreshCw,
	Pencil,
	Trash2,
	Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { apiCall } from "../../../../utils/api";
import URL from "../../../../utils/url";
import { toast } from "sonner";

const DEFAULT_DAYS = [7, 3, 1, 0, -1];

const toNumberOrNull = (value) => {
	if (value === "" || value === null || value === undefined) return null;
	const parsed = Number(value);
	if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) return null;
	return parsed;
};

const sortDaysDesc = (days = []) => [...days].sort((a, b) => b - a);

const dayLabel = (day) => {
	if (day > 0) return `${day} day${day > 1 ? "s" : ""} before expiry`;
	if (day === 0) return "On expiry date";
	const abs = Math.abs(day);
	return `${abs} day${abs > 1 ? "s" : ""} after expiry`;
};

const formatDaysInline = (days = []) => {
	if (!Array.isArray(days) || days.length === 0) return "-";
	return sortDaysDesc(days).join(", ");
};

const NotificationPage = () => {
	const [settings, setSettings] = React.useState([]);
	const [loading, setLoading] = React.useState(false);
	const [open, setOpen] = React.useState(false);
	const [submitting, setSubmitting] = React.useState(false);
	const [editMode, setEditMode] = React.useState(false);
	const [selectedId, setSelectedId] = React.useState(null);

	const [type, setType] = React.useState("subscription_expiry");
	const [daysBefore, setDaysBefore] = React.useState(DEFAULT_DAYS);
	const [enabled, setEnabled] = React.useState(true);

	const fetchSettings = async () => {
		setLoading(true);
		try {
			const response = await apiCall({
				endpoint: URL.notificationSettings,
				method: "GET",
				token: true,
			});

			if (!response?.success) {
				setSettings([]);
				toast.error(response?.message || "Failed to fetch notification settings.");
				return;
			}

			const payload = response?.data;
			if (Array.isArray(payload)) {
				setSettings(payload);
			} else if (payload && typeof payload === "object") {
				setSettings([payload]);
			} else {
				setSettings([]);
			}
		} catch (error) {
			setSettings([]);
			toast.error("Network Error", {
				description: error.message || "Could not fetch notification settings.",
			});
		} finally {
			setLoading(false);
		}
	};

	React.useEffect(() => {
		fetchSettings();
	}, []);

	const resetForm = () => {
		setType("subscription_expiry");
		setDaysBefore([...DEFAULT_DAYS]);
		setEnabled(true);
		setEditMode(false);
		setSelectedId(null);
	};

	const addDayOffset = () => {
		setDaysBefore((prev) => [...prev, 1]);
	};

	const removeDayOffset = (index) => {
		setDaysBefore((prev) => prev.filter((_, i) => i !== index));
	};

	const setDayOffsetAt = (index, value) => {
		setDaysBefore((prev) => {
			const next = [...prev];
			next[index] = value;
			return next;
		});
	};

	const fillFormFromItem = (item) => {
		setSelectedId(item?._id || null);
		setType(item?.type || "subscription_expiry");
		setEnabled(item?.enabled ?? true);

		const receivedDays = Array.isArray(item?.daysBefore)
			? item.daysBefore.map((day) => toNumberOrNull(day)).filter((day) => day !== null)
			: [];
		setDaysBefore(receivedDays.length > 0 ? receivedDays : [...DEFAULT_DAYS]);
	};

	const validateForm = () => {
		if (!type.trim()) return "Please enter notification type.";

		if (!Array.isArray(daysBefore) || daysBefore.length === 0) {
			return "Please add at least one notification day.";
		}

		const parsedDays = daysBefore.map((day) => toNumberOrNull(day));
		if (parsedDays.some((day) => day === null)) {
			return "Notification days must be whole numbers like 7, 3, 0, -1.";
		}

		const uniqueDays = new Set(parsedDays);
		if (uniqueDays.size !== parsedDays.length) {
			return "Duplicate days are not allowed. Please keep each day unique.";
		}

		return null;
	};

	const buildPayload = () => ({
		type: type.trim(),
		daysBefore: sortDaysDesc(daysBefore.map((day) => Number(day))),
		enabled,
	});

	const handleCreate = async () => {
		const validationMessage = validateForm();
		if (validationMessage) return toast.error(validationMessage);

		setSubmitting(true);
		try {
			const response = await apiCall({
				endpoint: URL.notificationSettings,
				method: "POST",
				body: buildPayload(),
				token: true,
			});

			if (response?.success) {
				toast.success("Notification setting created successfully!");
				await fetchSettings();
				setOpen(false);
				resetForm();
			} else {
				toast.error(response?.message || "Failed to create notification setting.");
			}
		} catch (error) {
			toast.error("Network Error", { description: error.message });
		} finally {
			setSubmitting(false);
		}
	};

	const handleUpdate = async () => {
		if (!selectedId) return toast.error("No notification setting selected.");

		const validationMessage = validateForm();
		if (validationMessage) return toast.error(validationMessage);

		setSubmitting(true);
		try {
			const response = await apiCall({
				endpoint: `${URL.notificationSettings}/${selectedId}`,
				method: "PATCH",
				body: buildPayload(),
				token: true,
			});

			if (response?.success) {
				toast.success("Notification setting updated successfully!");
				await fetchSettings();
				setOpen(false);
				resetForm();
			} else {
				toast.error(response?.message || "Failed to update notification setting.");
			}
		} catch (error) {
			toast.error("Network Error", { description: error.message });
		} finally {
			setSubmitting(false);
		}
	};

	const handleDelete = async (id) => {
		const confirmed = window.confirm(
			"Are you sure you want to delete this notification setting?"
		);
		if (!confirmed) return;

		try {
			const response = await apiCall({
				endpoint: `${URL.notificationSettings}/${id}`,
				method: "DELETE",
				token: true,
			});

			if (response?.success) {
				toast.success("Notification setting deleted successfully!");
				await fetchSettings();
			} else {
				toast.error(response?.message || "Failed to delete notification setting.");
			}
		} catch (error) {
			toast.error("Network Error", { description: error.message });
		}
	};

	const NotificationFormDialog = () => (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent className="w-[96vw] max-w-3xl max-h-[92vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						{editMode ? "Update Notification Setting" : "Create Notification Setting"}
					</DialogTitle>
					<DialogDescription>
						{editMode
							? "Update notification type, day offsets, and status."
							: "Create notification timing before/after plan expiry."}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-6">
					<div className="space-y-2">
						<Label htmlFor="notification-type">Notification Type *</Label>
						<Input
							id="notification-type"
							value={type}
							onChange={(e) => setType(e.target.value)}
							placeholder="subscription_expiry"
						/>
					</div>

					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<h3 className="text-sm font-semibold">Notification Days *</h3>
							<Button type="button" variant="outline" size="sm" onClick={addDayOffset}>
								<PlusCircle className="h-4 w-4 mr-2" />
								Add Day
							</Button>
						</div>

						<p className="text-xs text-muted-foreground">
							Use positive values for days before expiry (7, 3, 1), 0 for expiry day,
							and negative values for days after expiry (-1, -2).
						</p>

						<div className="flex flex-wrap gap-2">
							{[7, 5, 3, 1, 0, -1, -2].map((quickDay) => (
								<Button
									key={quickDay}
									type="button"
									variant="secondary"
									size="sm"
									onClick={() => {
										setDaysBefore((prev) =>
											prev.includes(quickDay) ? prev : [...prev, quickDay]
										);
									}}
								>
									{quickDay > 0 ? `+${quickDay}` : quickDay}
								</Button>
							))}
						</div>

						{daysBefore.map((day, index) => (
							<div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
								<div className="md:col-span-3 min-w-0">
									<Input
										type="number"
										value={day}
										onChange={(e) => setDayOffsetAt(index, e.target.value)}
										placeholder="7"
									/>
								</div>
								<div className="md:col-span-7 text-sm text-muted-foreground pt-2">
									{dayLabel(Number(day || 0))}
								</div>
								<Button
									className="md:col-span-2 w-full"
									type="button"
									size="icon"
									variant="destructive"
									onClick={() => removeDayOffset(index)}
								>
									<Trash2 className="h-4 w-4" />
								</Button>
							</div>
						))}
					</div>

					<div className="flex items-center gap-2">
						<input
							id="enabled"
							type="checkbox"
							checked={enabled}
							onChange={(e) => setEnabled(e.target.checked)}
						/>
						<Label htmlFor="enabled">Enabled</Label>
					</div>

					<Button
						className="w-full"
						onClick={editMode ? handleUpdate : handleCreate}
						disabled={submitting}
					>
						{submitting ? (
							<>
								<RefreshCw className="w-4 h-4 mr-2 animate-spin" />
								{editMode ? "Updating..." : "Creating..."}
							</>
						) : editMode ? (
							"Update Notification Setting"
						) : (
							"Save Notification Setting"
						)}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);

	return (
		<div className="p-6 space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">Notification Settings</h1>
				<div className="flex gap-2">
					<Button variant="outline" onClick={fetchSettings} disabled={loading}>
						<RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
						Refresh
					</Button>
					<Button
						onClick={() => {
							resetForm();
							setOpen(true);
						}}
					>
						<PlusCircle className="w-4 h-4 mr-2" />
						Create Setting
					</Button>
				</div>
			</div>

			<div className="border rounded-lg">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Type</TableHead>
							<TableHead>Days</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{loading ? (
							<TableRow>
								<TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
									Loading notification settings...
								</TableCell>
							</TableRow>
						) : settings.length === 0 ? (
							<TableRow>
								<TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
									No notification settings found
								</TableCell>
							</TableRow>
						) : (
							settings.map((item) => (
								<TableRow key={item._id || item.type}>
									<TableCell className="font-medium">
										<div className="flex items-center gap-2">
											<Bell className="h-4 w-4 text-muted-foreground" />
											<span>{item.type || "-"}</span>
										</div>
									</TableCell>
									<TableCell>{formatDaysInline(item.daysBefore)}</TableCell>
									<TableCell>
										<span
											className={cn(
												"px-2 py-1 rounded-full text-xs font-medium",
												item.enabled
													? "bg-green-100 text-green-800"
													: "bg-red-100 text-red-800"
											)}
										>
											{item.enabled ? "Enabled" : "Disabled"}
										</span>
									</TableCell>
									<TableCell>
										<div className="flex items-center gap-2">
											<Button
												size="sm"
												variant="outline"
												onClick={() => {
													fillFormFromItem(item);
													setEditMode(true);
													setOpen(true);
												}}
											>
												<Pencil className="h-4 w-4 mr-2" />
												Edit
											</Button>
											<Button
												size="sm"
												variant="destructive"
												onClick={() => handleDelete(item._id)}
												disabled={!item._id}
											>
												<Trash2 className="h-4 w-4 mr-2" />
												Delete
											</Button>
										</div>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>

			{NotificationFormDialog()}
		</div>
	);
};

export default NotificationPage;
