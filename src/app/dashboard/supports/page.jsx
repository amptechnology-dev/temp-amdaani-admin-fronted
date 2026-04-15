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
import {
	PlusCircle,
	RefreshCw,
	Search,
	Pencil,
	Trash2,
	Phone,
	Mail,
	Star,
} from "lucide-react";

export default function SupportPage() {
	const [supports, setSupports] = useState([]);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState(null);
	const [searchTerm, setSearchTerm] = useState("");

	const [open, setOpen] = useState(false);
	const [editMode, setEditMode] = useState(false);
	const [selectedSupportId, setSelectedSupportId] = useState(null);
	const [phone, setPhone] = useState("");
	const [email, setEmail] = useState("");
	const [isPrimary, setIsPrimary] = useState(false);

	useEffect(() => {
		fetchSupports();
	}, []);

	const fetchSupports = async () => {
		try {
			setLoading(true);
			setError(null);

			const response = await apiCall({
				endpoint: URL.allHelpline,
				method: "GET",
			});

			if (response?.success) {
				setSupports(Array.isArray(response.data) ? response.data : []);
			} else {
				setSupports([]);
				setError(response?.message || "Failed to fetch supports");
			}
		} catch (err) {
			console.error("Error fetching supports:", err);
			setSupports([]);
			setError("Failed to load supports. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	const resetForm = () => {
		setPhone("");
		setEmail("");
		setIsPrimary(false);
		setEditMode(false);
		setSelectedSupportId(null);
	};

	const handleOpenAdd = () => {
		resetForm();
		setOpen(true);
	};

	const handleOpenEdit = async (supportId) => {
		try {
			setSubmitting(true);

			const response = await apiCall({
				endpoint: `${URL.helpline}/${supportId}`,
				method: "GET",
			});

			if (response?.success && response?.data) {
				const support = response.data;
				setEditMode(true);
				setSelectedSupportId(support._id);
				setPhone(support.phone || "");
				setEmail(support.email || "");
				setIsPrimary(Boolean(support.isPrimary));
				setOpen(true);
			} else {
				alert(response?.message || "Failed to fetch support details.");
			}
		} catch (err) {
			console.error("Error fetching support details:", err);
			alert("Failed to fetch support details. Please try again.");
		} finally {
			setSubmitting(false);
		}
	};

	const handleSaveSupport = async () => {
		if (!phone.trim()) {
			alert("Please enter a phone number.");
			return;
		}

		if (!email.trim()) {
			alert("Please enter an email address.");
			return;
		}

		setSubmitting(true);
		try {
			const payload = {
				phone: phone.trim(),
				email: email.trim(),
				isPrimary,
			};

			const response = await apiCall({
				endpoint: editMode ? `${URL.helpline}/${selectedSupportId}` : URL.helpline,
				method: editMode ? "PUT" : "POST",
				body: payload,
			});

			if (response?.success) {
				await fetchSupports();
				setOpen(false);
				resetForm();
			} else {
				alert(response?.message || `Failed to ${editMode ? "update" : "create"} support.`);
			}
		} catch (err) {
			console.error("Error saving support:", err);
			alert("Failed to save support. Please try again.");
		} finally {
			setSubmitting(false);
		}
	};

	const handleDeleteSupport = async (supportId) => {
		const confirmed = window.confirm("Are you sure you want to delete this support?");
		if (!confirmed) return;

		try {
			const response = await apiCall({
				endpoint: `${URL.helpline}/${supportId}`,
				method: "DELETE",
			});

			if (response?.success) {
				await fetchSupports();
			} else {
				alert(response?.message || "Failed to delete support.");
			}
		} catch (err) {
			console.error("Error deleting support:", err);
			alert("Failed to delete support. Please try again.");
		}
	};

	const filteredSupports = useMemo(() => {
		const query = searchTerm.trim().toLowerCase();
		if (!query) return supports;

		return supports.filter((support) => {
			const p = support.phone?.toLowerCase() || "";
			const e = support.email?.toLowerCase() || "";
			return p.includes(query) || e.includes(query);
		});
	}, [supports, searchTerm]);

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
				<CardTitle>Supports</CardTitle>
				<CardDescription>
					Manage and view all support contacts. Showing: {filteredSupports.length} of {supports.length} supports
				</CardDescription>
			</CardHeader>

			<CardContent>
				<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="relative w-full sm:max-w-md">
						<Search className="text-muted-foreground absolute left-2 top-2.5 h-4 w-4" />
						<Input
							placeholder="Search by phone or email..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="pl-8"
						/>
					</div>

					<div className="flex items-center gap-2">
						<Button variant="outline" onClick={fetchSupports} disabled={loading}>
							<RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
							Refresh
						</Button>

						<Dialog open={open} onOpenChange={setOpen}>
							<DialogTrigger asChild>
								<Button onClick={handleOpenAdd}>
									<PlusCircle className="mr-2 h-4 w-4" />
									Add Support
								</Button>
							</DialogTrigger>

							<DialogContent className="max-w-xl">
								<DialogHeader>
									<DialogTitle>{editMode ? "Edit Support" : "Create Support"}</DialogTitle>
									<DialogDescription>
										{editMode
											? "Update the support phone and email details."
											: "Add a new support contact for users."}
									</DialogDescription>
								</DialogHeader>

								<div className="space-y-4">
									<div className="space-y-2">
										<Label htmlFor="support-phone">Phone</Label>
										<div className="relative">
											<Phone className="text-muted-foreground pointer-events-none absolute left-2 top-2.5 h-4 w-4" />
											<Input
												id="support-phone"
												value={phone}
												onChange={(e) => setPhone(e.target.value)}
												placeholder="9903419235"
												className="pl-8"
											/>
										</div>
									</div>

									<div className="space-y-2">
										<Label htmlFor="support-email">Email</Label>
										<div className="relative">
											<Mail className="text-muted-foreground pointer-events-none absolute left-2 top-2.5 h-4 w-4" />
											<Input
												id="support-email"
												type="email"
												value={email}
												onChange={(e) => setEmail(e.target.value)}
												placeholder="support@email.com"
												className="pl-8"
											/>
										</div>
									</div>

									<label
										htmlFor="support-primary"
										className="flex cursor-pointer items-center gap-2 rounded-md border p-3"
									>
										<input
											id="support-primary"
											type="checkbox"
											checked={isPrimary}
											onChange={(e) => setIsPrimary(e.target.checked)}
											className="h-4 w-4"
										/>
										<Star className="h-4 w-4" />
										<span className="text-sm">Mark this as primary support</span>
									</label>

									<Button className="w-full" onClick={handleSaveSupport} disabled={submitting}>
										{submitting
											? editMode
												? "Updating..."
												: "Creating..."
											: editMode
											? "Update Support"
											: "Save Support"}
									</Button>
								</div>
							</DialogContent>
						</Dialog>
					</div>
				</div>

				{error ? (
					<div className="text-center text-destructive">
						{error}
						<Button onClick={fetchSupports} className="ml-4" variant="outline">
							Retry
						</Button>
					</div>
				) : (
					<div className="rounded-md border">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Phone</TableHead>
									<TableHead>Email</TableHead>
									<TableHead>Primary</TableHead>
									<TableHead>Created</TableHead>
									<TableHead>Updated</TableHead>
									<TableHead>Actions</TableHead>
								</TableRow>
							</TableHeader>

							<TableBody>
								{loading ? (
									<TableRow>
										<TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
											Loading supports...
										</TableCell>
									</TableRow>
								) : filteredSupports.length === 0 ? (
									<TableRow>
										<TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
											No supports found
										</TableCell>
									</TableRow>
								) : (
									filteredSupports.map((support) => (
										<TableRow key={support._id}>
											<TableCell className="font-medium">{support.phone || "N/A"}</TableCell>
											<TableCell className="max-w-[360px] whitespace-normal">
												{support.email || "N/A"}
											</TableCell>
											<TableCell>
												{support.isPrimary ? (
													<span className="rounded-full border border-emerald-300 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
														Primary
													</span>
												) : (
													<span className="text-muted-foreground text-sm">No</span>
												)}
											</TableCell>
											<TableCell>{formatDate(support.createdAt)}</TableCell>
											<TableCell>{formatDate(support.updatedAt)}</TableCell>
											<TableCell>
												<div className="flex items-center gap-2">
													<Button
														size="icon"
														variant="outline"
														onClick={() => handleOpenEdit(support._id)}
														disabled={submitting}
													>
														<Pencil className="h-4 w-4" />
													</Button>
													<Button
														size="icon"
														variant="destructive"
														onClick={() => handleDeleteSupport(support._id)}
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
				)}
			</CardContent>
		</Card>
	);
}
