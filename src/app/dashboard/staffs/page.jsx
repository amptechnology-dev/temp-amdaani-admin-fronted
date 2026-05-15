"use client";

import * as React from "react";
import { apiCall } from "../../../../utils/api";
import URL from "../../../../utils/url";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, PlusCircle, RefreshCw, Search, Pencil, Trash2, Users, Sparkles } from "lucide-react";

const STAFF_API_URL = URL.staff;

const initialFormState = {
	name: "",
	designation: "",
	contactNumber: "",
	agentCode: "",
	isActive: true,
};

export default function StaffsPage() {
	const [staffs, setStaffs] = React.useState([]);
	const [loading, setLoading] = React.useState(true);
	const [submitting, setSubmitting] = React.useState(false);
	const [error, setError] = React.useState(null);
	const [open, setOpen] = React.useState(false);
	const [editMode, setEditMode] = React.useState(false);
	const [selectedStaffId, setSelectedStaffId] = React.useState(null);
	const [searchTerm, setSearchTerm] = React.useState("");
	const [statusFilter, setStatusFilter] = React.useState("all");
	const [form, setForm] = React.useState(initialFormState);

	const fetchStaffs = React.useCallback(async () => {
		try {
			setLoading(true);
			setError(null);

			const response = await apiCall({
				endpoint: STAFF_API_URL,
				method: "GET",
				token: true,
			});

			if (response?.success && Array.isArray(response.data)) {
				setStaffs(response.data);
			} else {
				setStaffs([]);
				setError(response?.message || "Failed to fetch staff records.");
			}
		} catch (err) {
			console.error("Error fetching staff:", err);
			setStaffs([]);
			setError("Failed to load staff records. Please try again.");
		} finally {
			setLoading(false);
		}
	}, []);

	React.useEffect(() => {
		fetchStaffs();
	}, [fetchStaffs]);

	const resetForm = () => {
		setForm(initialFormState);
		setEditMode(false);
		setSelectedStaffId(null);
	};

	const openCreateDialog = () => {
		resetForm();
		setOpen(true);
	};

	const openEditDialog = (staff) => {
		setSelectedStaffId(staff._id);
		setForm({
			name: staff.name || "",
			designation: staff.designation || "",
			contactNumber: staff.contactNumber || "",
			agentCode: staff.agentCode || "",
			isActive: staff.isActive !== false,
		});
		setEditMode(true);
		setOpen(true);
	};

	const handleDialogChange = (nextOpen) => {
		setOpen(nextOpen);
		if (!nextOpen) {
			resetForm();
		}
	};

	const updateForm = (field, value) => {
		setForm((prev) => ({ ...prev, [field]: value }));
	};

	const generateAgentCode = () => {
		const randomNumber = Math.floor(100000 + Math.random() * 900000);
		updateForm("agentCode", `AGENT-${randomNumber}`);
	};

	const handleSaveStaff = async () => {
		if (!form.name.trim()) return toast.error("Please enter staff name.");
		if (!form.designation.trim()) return toast.error("Please enter designation.");
		if (!form.contactNumber.trim()) return toast.error("Please enter contact number.");
		if (!form.agentCode.trim()) return toast.error("Please enter agent code.");

		setSubmitting(true);
		try {
			const payload = {
				name: form.name.trim(),
				designation: form.designation.trim(),
				contactNumber: form.contactNumber.trim(),
				agentCode: form.agentCode.trim(),
				isActive: form.isActive,
			};

			const response = await apiCall({
				endpoint: editMode ? `${STAFF_API_URL}/${selectedStaffId}` : STAFF_API_URL,
				method: editMode ? "PUT" : "POST",
				body: payload,
				token: true,
			});

			if (response?.success) {
				toast.success(editMode ? "Staff updated successfully." : "Staff created successfully.");
				await fetchStaffs();
				setOpen(false);
				resetForm();
			} else {
				toast.error(response?.message || (editMode ? "Failed to update staff." : "Failed to create staff."));
			}
		} catch (err) {
			console.error("Error saving staff:", err);
			toast.error("Network Error", {
				description: err.message || "Could not save staff.",
			});
		} finally {
			setSubmitting(false);
		}
	};

	const handleDeleteStaff = async (staff) => {
		const confirmDelete = window.confirm(`Delete ${staff.name || "this staff"}? This action cannot be undone.`);
		if (!confirmDelete) return;

		setSubmitting(true);
		try {
			const response = await apiCall({
				endpoint: `${STAFF_API_URL}/${staff._id}`,
				method: "DELETE",
				token: true,
			});

			if (response?.success) {
				toast.success("Staff deleted successfully.");
				await fetchStaffs();
			} else {
				toast.error(response?.message || "Failed to delete staff.");
			}
		} catch (err) {
			console.error("Error deleting staff:", err);
			toast.error("Network Error", {
				description: err.message || "Could not delete staff.",
			});
		} finally {
			setSubmitting(false);
		}
	};

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

	const filteredStaffs = staffs.filter((staff) => {
		const search = searchTerm.trim().toLowerCase();
		const matchesSearch =
			!search ||
			staff.name?.toLowerCase().includes(search) ||
			staff.designation?.toLowerCase().includes(search) ||
			staff.contactNumber?.toLowerCase().includes(search) ||
			staff.agentCode?.toLowerCase().includes(search);

		const matchesStatus =
			statusFilter === "all" ||
			(statusFilter === "active" && staff.isActive !== false) ||
			(statusFilter === "inactive" && staff.isActive === false);

		return matchesSearch && matchesStatus;
	});

	const totalStaffs = staffs.length;
	const activeStaffs = staffs.filter((staff) => staff.isActive !== false).length;
	const inactiveStaffs = totalStaffs - activeStaffs;
	const designationCount = new Set(
		staffs.map((staff) => staff.designation).filter(Boolean).map((value) => value.trim().toLowerCase())
	).size;

	const StaffFormDialog = () => (
		<Dialog open={open} onOpenChange={handleDialogChange}>
			<DialogContent className="max-h-[90vh] max-w-2xl overflow-hidden p-0">
				<div className="flex max-h-[90vh] flex-col">
					<div className="border-b px-6 py-5">
						<DialogHeader className="space-y-2 text-left">
							<DialogTitle>{editMode ? "Edit Staff" : "Create New Staff"}</DialogTitle>
							<DialogDescription>
								{editMode
									? "Update staff details and active status."
									: "Fill in the details to add a new staff member."}
							</DialogDescription>
						</DialogHeader>
					</div>

					<div className="overflow-y-auto px-6 py-6">
						<div className="grid gap-5 md:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="name">Name *</Label>
								<Input
									id="name"
									value={form.name}
									onChange={(e) => updateForm("name", e.target.value)}
									placeholder="Sumit Pal"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="designation">Designation *</Label>
								<Input
									id="designation"
									value={form.designation}
									onChange={(e) => updateForm("designation", e.target.value)}
									placeholder="Pion"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="contactNumber">Contact Number *</Label>
								<Input
									id="contactNumber"
									type="tel"
									value={form.contactNumber}
									onChange={(e) => updateForm("contactNumber", e.target.value)}
									placeholder="8017505010"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="agentCode">Agent Code *</Label>
								<div className="flex gap-2">
									<Input
										id="agentCode"
										value={form.agentCode}
										onChange={(e) => updateForm("agentCode", e.target.value)}
										placeholder="AGENT-784541"
										className="flex-1"
									/>
									<Button type="button" variant="outline" onClick={generateAgentCode} disabled={submitting}>
										<Sparkles className="mr-2 h-4 w-4" />
										Generate
									</Button>
								</div>
							</div>

							<div className="flex items-center gap-2 md:col-span-2">
								<input
									id="isActive"
									type="checkbox"
									checked={form.isActive}
									onChange={(e) => updateForm("isActive", e.target.checked)}
								/>
								<Label htmlFor="isActive">Active</Label>
							</div>
						</div>

						<div className="mt-6 flex flex-col gap-3 border-t pt-5 sm:flex-row">
							<Button
								className={cn("w-full", editMode && "sm:flex-1")}
								onClick={handleSaveStaff}
								disabled={submitting}
							>
								{submitting ? (
									<>
										<RefreshCw className="mr-2 h-4 w-4 animate-spin" />
										{editMode ? "Updating..." : "Creating..."}
									</>
								) : editMode ? (
									"Update Staff"
								) : (
									"Save Staff"
								)}
							</Button>

							{editMode && (
								<Button
									className="w-full sm:w-auto"
									variant="destructive"
									onClick={() => handleDeleteStaff({ _id: selectedStaffId, name: form.name })}
									disabled={submitting}
								>
									<Trash2 className="mr-2 h-4 w-4" />
									Delete Staff
								</Button>
							)}
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);

	if (loading) {
		return (
			<Card>
				<CardContent className="p-6">
					<div className="text-center">Loading staff records...</div>
				</CardContent>
			</Card>
		);
	}

	if (error) {
		return (
			<Card>
				<CardContent className="p-6">
					<div className="text-center text-destructive">
						{error}
						<Button onClick={fetchStaffs} className="ml-4" variant="outline">
							Retry
						</Button>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-6">
			<Card className="overflow-hidden border-border/60 shadow-sm">
				<CardHeader className="border-b bg-gradient-to-r from-slate-50 to-white">
					<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
						<div className="space-y-1">
							<CardTitle className="text-2xl">Staff Management</CardTitle>
							<CardDescription>
								Create, update, and manage staff records. Showing {filteredStaffs.length} of {totalStaffs} staff members.
							</CardDescription>
						</div>

						<div className="flex flex-wrap gap-2">
							<Button variant="outline" onClick={fetchStaffs} disabled={loading || submitting}>
								<RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
								Refresh
							</Button>

							<Button onClick={openCreateDialog}>
								<PlusCircle className="mr-2 h-4 w-4" />
								Add Staff
							</Button>
						</div>
					</div>

					<div className="grid gap-3 pt-2 sm:grid-cols-2 xl:grid-cols-4">
						<div className="rounded-xl border bg-background p-4">
							<p className="text-xs uppercase tracking-wide text-muted-foreground">Total Staff</p>
							<div className="mt-2 flex items-center gap-2">
								<Users className="h-4 w-4 text-muted-foreground" />
								<span className="text-2xl font-semibold">{totalStaffs}</span>
							</div>
						</div>

						<div className="rounded-xl border bg-background p-4">
							<p className="text-xs uppercase tracking-wide text-muted-foreground">Active</p>
							<div className="mt-2 flex items-center gap-2">
								<Badge className="bg-emerald-600 hover:bg-emerald-600">Active</Badge>
								<span className="text-2xl font-semibold">{activeStaffs}</span>
							</div>
						</div>

						<div className="rounded-xl border bg-background p-4">
							<p className="text-xs uppercase tracking-wide text-muted-foreground">Inactive</p>
							<div className="mt-2 flex items-center gap-2">
								<Badge variant="secondary">Inactive</Badge>
								<span className="text-2xl font-semibold">{inactiveStaffs}</span>
							</div>
						</div>

						<div className="rounded-xl border bg-background p-4">
							<p className="text-xs uppercase tracking-wide text-muted-foreground">Designations</p>
							<div className="mt-2 flex items-center gap-2">
								<Badge variant="outline">Unique</Badge>
								<span className="text-2xl font-semibold">{designationCount}</span>
							</div>
						</div>
					</div>
				</CardHeader>

				<CardContent className="space-y-5 p-6">
					<div className="flex flex-col gap-4 lg:flex-row lg:items-center">
						<div className="relative flex-1">
							<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								placeholder="Search by name, designation, contact number, or agent code..."
								className="pl-9"
							/>
						</div>

						<div className="flex items-center gap-3">
							<div className="flex items-center gap-2">
								<Filter className="h-4 w-4 text-muted-foreground" />
								<span className="text-sm font-medium">Status</span>
							</div>
							<Select value={statusFilter} onValueChange={setStatusFilter}>
								<SelectTrigger className="w-[180px]">
									<SelectValue placeholder="Select status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Status</SelectItem>
									<SelectItem value="active">Active</SelectItem>
									<SelectItem value="inactive">Inactive</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="rounded-xl border">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Name</TableHead>
									<TableHead>Designation</TableHead>
									<TableHead>Contact Number</TableHead>
									<TableHead>Agent Code</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Created</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>

							<TableBody>
								{filteredStaffs.length === 0 ? (
									<TableRow>
										<TableCell colSpan={7} className="py-10 text-center">
											<div className="text-muted-foreground">No staff found matching your criteria</div>
										</TableCell>
									</TableRow>
								) : (
									filteredStaffs.map((staff) => (
										<TableRow key={staff._id}>
											<TableCell className="font-medium">
												<div className="flex flex-col">
													<span>{staff.name || "Unnamed Staff"}</span>
													<span className="text-xs text-muted-foreground">Staff member</span>
												</div>
											</TableCell>

											<TableCell>{staff.designation || "N/A"}</TableCell>

											<TableCell>{staff.contactNumber || "N/A"}</TableCell>

											<TableCell>
												<Badge variant="outline" className="font-mono">
													{staff.agentCode || "N/A"}
												</Badge>
											</TableCell>

											<TableCell>
												<Badge
													variant={staff.isActive === false ? "secondary" : "default"}
													className={cn(staff.isActive !== false && "bg-emerald-600 hover:bg-emerald-600")}
												>
													{staff.isActive === false ? "Inactive" : "Active"}
												</Badge>
											</TableCell>

											<TableCell>{formatDate(staff.createdAt)}</TableCell>

											<TableCell>
												<div className="flex items-center justify-end gap-2">
													<Button size="icon" variant="outline" onClick={() => openEditDialog(staff)}>
														<Pencil className="h-4 w-4" />
													</Button>
													<Button
														size="icon"
														variant="destructive"
														onClick={() => handleDeleteStaff(staff)}
														disabled={submitting}
													>
														<Trash2 className="h-4 w-4" />
													</Button>
												</div>
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</div>
				</CardContent>
			</Card>

			{StaffFormDialog()}
		</div>
	);
}
