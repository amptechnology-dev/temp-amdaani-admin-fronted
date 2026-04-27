"use client";

import { useEffect, useMemo, useState } from "react";
import { apiCall } from "../../../../utils/api";
import URL from "../../../../utils/url";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { CalendarDays, Pencil, PlusCircle, RefreshCw, Search, Wallet } from "lucide-react";

export default function ReferralSettingsPage() {
	const [settings, setSettings] = useState([]);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState(null);
	const [searchTerm, setSearchTerm] = useState("");

	const [open, setOpen] = useState(false);
	const [editMode, setEditMode] = useState(false);
	const [validityDays, setValidityDays] = useState("");
	const [senderAmount, setSenderAmount] = useState("");
	const [receiverAmount, setReceiverAmount] = useState("");

	useEffect(() => {
		fetchSettings();
	}, []);

	const normalizeSettingsData = (data) => {
		if (Array.isArray(data)) return data;
		if (data && typeof data === "object") return [data];
		return [];
	};

	const fetchSettings = async () => {
		try {
			setLoading(true);
			setError(null);

			const response = await apiCall({
				endpoint: URL.referralSettings,
				method: "GET",
			});

			if (response?.success) {
				setSettings(normalizeSettingsData(response.data));
			} else {
				setSettings([]);
				setError(response?.message || "Failed to fetch referral settings");
			}
		} catch (err) {
			console.error("Error fetching referral settings:", err);
			setSettings([]);
			setError("Failed to load referral settings. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	const resetForm = () => {
		setValidityDays("");
		setSenderAmount("");
		setReceiverAmount("");
		setEditMode(false);
	};

	const handleOpenAdd = () => {
		resetForm();
		setOpen(true);
	};

	const handleOpenEdit = (item) => {
		setEditMode(true);
		setValidityDays(String(item.validityDays ?? ""));
		setSenderAmount(String(item.senderAmount ?? ""));
		setReceiverAmount(String(item.receiverAmount ?? ""));
		setOpen(true);
	};

	const handleSave = async () => {
		const validity = Number(validityDays);
		const sender = Number(senderAmount);
		const receiver = Number(receiverAmount);

		if (!Number.isFinite(validity) || validity <= 0) {
			alert("Please enter a valid validity days value.");
			return;
		}

		if (!Number.isFinite(sender) || sender < 0) {
			alert("Please enter a valid sender amount.");
			return;
		}

		if (!Number.isFinite(receiver) || receiver < 0) {
			alert("Please enter a valid receiver amount.");
			return;
		}

		setSubmitting(true);
		try {
			const payload = {
				validityDays: validity,
				senderAmount: sender,
				receiverAmount: receiver,
			};

			const response = await apiCall({
				endpoint: URL.referralSettings,
				method: editMode ? "PUT" : "POST",
				body: payload,
			});

			if (response?.success) {
				await fetchSettings();
				setOpen(false);
				resetForm();
			} else {
				alert(response?.message || `Failed to ${editMode ? "update" : "create"} referral setting.`);
			}
		} catch (err) {
			console.error("Error saving referral setting:", err);
			alert("Failed to save referral setting. Please try again.");
		} finally {
			setSubmitting(false);
		}
	};

	const filteredSettings = useMemo(() => {
		const query = searchTerm.trim().toLowerCase();
		if (!query) return settings;

		return settings.filter((item) => {
			const validity = String(item.validityDays ?? "").toLowerCase();
			const sender = String(item.senderAmount ?? "").toLowerCase();
			const receiver = String(item.receiverAmount ?? "").toLowerCase();
			const active = item.isActive ? "active" : "inactive";
			return (
				validity.includes(query) ||
				sender.includes(query) ||
				receiver.includes(query) ||
				active.includes(query)
			);
		});
	}, [settings, searchTerm]);

	const formatDate = (dateString) => {
		if (!dateString) return "N/A";
		try {
			return new Date(dateString).toLocaleDateString("en-US", {
				year: "numeric",
				month: "short",
				day: "numeric",
			});
		} catch {
			return "Invalid Date";
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Referral Settings</CardTitle>
				<CardDescription>
					Manage and view all referral settings. Showing: {filteredSettings.length} of {settings.length} settings
				</CardDescription>
			</CardHeader>

			<CardContent>
				<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="relative w-full sm:max-w-md">
						<Search className="text-muted-foreground absolute left-2 top-2.5 h-4 w-4" />
						<Input
							placeholder="Search by validity days, sender amount, receiver amount..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="pl-8"
						/>
					</div>

					<div className="flex items-center gap-2">
						<Button variant="outline" onClick={fetchSettings} disabled={loading}>
							<RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
							Refresh
						</Button>

						<Dialog open={open} onOpenChange={setOpen}>
							<DialogTrigger asChild>
								<Button onClick={handleOpenAdd}>
									<PlusCircle className="mr-2 h-4 w-4" />
									Add Referral Setting
								</Button>
							</DialogTrigger>

							<DialogContent className="max-w-xl">
								<DialogHeader>
									<DialogTitle>{editMode ? "Edit Referral Setting" : "Create Referral Setting"}</DialogTitle>
									<DialogDescription>
										{editMode
											? "Update referral setting values."
											: "Add a new referral setting for rewards."}
									</DialogDescription>
								</DialogHeader>

								<div className="space-y-4">
									<div className="space-y-2">
										<Label htmlFor="ref-validity-days">Validity Days</Label>
										<div className="relative">
											<CalendarDays className="text-muted-foreground pointer-events-none absolute left-2 top-2.5 h-4 w-4" />
											<Input
												id="ref-validity-days"
												type="number"
												min="1"
												value={validityDays}
												onChange={(e) => setValidityDays(e.target.value)}
												placeholder="30"
												className="pl-8"
											/>
										</div>
									</div>

									<div className="space-y-2">
										<Label htmlFor="ref-sender-amount">Sender Amount</Label>
										<div className="relative">
											<Wallet className="text-muted-foreground pointer-events-none absolute left-2 top-2.5 h-4 w-4" />
											<Input
												id="ref-sender-amount"
												type="number"
												min="0"
												value={senderAmount}
												onChange={(e) => setSenderAmount(e.target.value)}
												placeholder="50"
												className="pl-8"
											/>
										</div>
									</div>

									<div className="space-y-2">
										<Label htmlFor="ref-receiver-amount">Receiver Amount</Label>
										<div className="relative">
											<Wallet className="text-muted-foreground pointer-events-none absolute left-2 top-2.5 h-4 w-4" />
											<Input
												id="ref-receiver-amount"
												type="number"
												min="0"
												value={receiverAmount}
												onChange={(e) => setReceiverAmount(e.target.value)}
												placeholder="20"
												className="pl-8"
											/>
										</div>
									</div>

									<Button className="w-full" onClick={handleSave} disabled={submitting}>
										{submitting
											? editMode
												? "Updating..."
												: "Creating..."
											: editMode
											? "Update Referral Setting"
											: "Save Referral Setting"}
									</Button>
								</div>
							</DialogContent>
						</Dialog>
					</div>
				</div>

				{error ? (
					<div className="text-center text-destructive">
						{error}
						<Button onClick={fetchSettings} className="ml-4" variant="outline">
							Retry
						</Button>
					</div>
				) : (
					<div className="rounded-md border">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Validity Days</TableHead>
									<TableHead>Sender Amount</TableHead>
									<TableHead>Receiver Amount</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Created</TableHead>
									<TableHead>Updated</TableHead>
									<TableHead>Actions</TableHead>
								</TableRow>
							</TableHeader>

							<TableBody>
								{loading ? (
									<TableRow>
										<TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
											Loading referral settings...
										</TableCell>
									</TableRow>
								) : filteredSettings.length === 0 ? (
									<TableRow>
										<TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
											No referral settings found
										</TableCell>
									</TableRow>
								) : (
									filteredSettings.map((item) => (
										<TableRow key={item._id}>
											<TableCell className="font-medium">{item.validityDays ?? "N/A"}</TableCell>
											<TableCell>{item.senderAmount ?? "N/A"}</TableCell>
											<TableCell>{item.receiverAmount ?? "N/A"}</TableCell>
											<TableCell>
												{item.isActive ? (
													<span className="rounded-full border border-emerald-300 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
														Active
													</span>
												) : (
													<span className="rounded-full border border-slate-300 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700">
														Inactive
													</span>
												)}
											</TableCell>
											<TableCell>{formatDate(item.createdAt)}</TableCell>
											<TableCell>{formatDate(item.updatedAt)}</TableCell>
											<TableCell>
												<div className="flex items-center gap-2">
													<Button
														size="icon"
														variant="outline"
														onClick={() => handleOpenEdit(item)}
														disabled={submitting}
													>
														<Pencil className="h-4 w-4" />
													</Button>
												</div>
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
