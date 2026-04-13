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
import { PlusCircle, RefreshCw, Search, Pencil, Trash2 } from "lucide-react";

export default function FaqPage() {
	const [faqs, setFaqs] = useState([]);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState(null);
	const [searchTerm, setSearchTerm] = useState("");

	const [open, setOpen] = useState(false);
	const [editMode, setEditMode] = useState(false);
	const [selectedFaqId, setSelectedFaqId] = useState(null);
	const [question, setQuestion] = useState("");
	const [answer, setAnswer] = useState("");

	useEffect(() => {
		fetchFaqs();
	}, []);

	const fetchFaqs = async () => {
		try {
			setLoading(true);
			setError(null);

			const response = await apiCall({
				endpoint: URL.faq,
				method: "GET",
			});

			if (response?.success) {
				setFaqs(Array.isArray(response.data) ? response.data : []);
			} else {
				setFaqs([]);
				setError(response?.message || "Failed to fetch FAQs");
			}
		} catch (err) {
			console.error("Error fetching FAQs:", err);
			setFaqs([]);
			setError("Failed to load FAQs. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	const resetForm = () => {
		setQuestion("");
		setAnswer("");
		setEditMode(false);
		setSelectedFaqId(null);
	};

	const handleOpenAdd = () => {
		resetForm();
		setOpen(true);
	};

	const handleOpenEdit = (faq) => {
		setEditMode(true);
		setSelectedFaqId(faq._id);
		setQuestion(faq.question || "");
		setAnswer(faq.answer || "");
		setOpen(true);
	};

	const handleSaveFaq = async () => {
		if (!question.trim()) {
			alert("Please enter a question.");
			return;
		}

		if (!answer.trim()) {
			alert("Please enter an answer.");
			return;
		}

		setSubmitting(true);
		try {
			const payload = {
				question: question.trim(),
				answer: answer.trim(),
			};

			const response = await apiCall({
				endpoint: editMode ? `${URL.faq}/${selectedFaqId}` : URL.faq,
				method: editMode ? "PUT" : "POST",
				body: payload,
			});

			if (response?.success) {
				await fetchFaqs();
				setOpen(false);
				resetForm();
			} else {
				alert(response?.message || `Failed to ${editMode ? "update" : "create"} FAQ.`);
			}
		} catch (err) {
			console.error("Error saving FAQ:", err);
			alert("Failed to save FAQ. Please try again.");
		} finally {
			setSubmitting(false);
		}
	};

	const handleDeleteFaq = async (faqId) => {
		const confirmed = window.confirm("Are you sure you want to delete this FAQ?");
		if (!confirmed) return;

		try {
			const response = await apiCall({
				endpoint: `${URL.faq}/${faqId}`,
				method: "DELETE",
			});

			if (response?.success) {
				await fetchFaqs();
			} else {
				alert(response?.message || "Failed to delete FAQ.");
			}
		} catch (err) {
			console.error("Error deleting FAQ:", err);
			alert("Failed to delete FAQ. Please try again.");
		}
	};

	const filteredFaqs = useMemo(() => {
		const query = searchTerm.trim().toLowerCase();
		if (!query) return faqs;

		return faqs.filter((faq) => {
			const q = faq.question?.toLowerCase() || "";
			const a = faq.answer?.toLowerCase() || "";
			return q.includes(query) || a.includes(query);
		});
	}, [faqs, searchTerm]);

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
				<CardTitle>FAQs</CardTitle>
				<CardDescription>
					Manage and view all FAQs. Showing: {filteredFaqs.length} of {faqs.length} FAQs
				</CardDescription>
			</CardHeader>

			<CardContent>
				<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="relative w-full sm:max-w-md">
						<Search className="text-muted-foreground absolute left-2 top-2.5 h-4 w-4" />
						<Input
							placeholder="Search by question or answer..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="pl-8"
						/>
					</div>

					<div className="flex items-center gap-2">
						<Button variant="outline" onClick={fetchFaqs} disabled={loading}>
							<RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
							Refresh
						</Button>

						<Dialog open={open} onOpenChange={setOpen}>
							<DialogTrigger asChild>
								<Button onClick={handleOpenAdd}>
									<PlusCircle className="mr-2 h-4 w-4" />
									Add FAQ
								</Button>
							</DialogTrigger>

							<DialogContent className="max-w-2xl">
								<DialogHeader>
									<DialogTitle>{editMode ? "Edit FAQ" : "Create FAQ"}</DialogTitle>
									<DialogDescription>
										{editMode
											? "Update the question and answer for this FAQ."
											: "Add a new FAQ item for users."}
									</DialogDescription>
								</DialogHeader>

								<div className="space-y-4">
									<div className="space-y-2">
										<Label htmlFor="faq-question">Question</Label>
										<Input
											id="faq-question"
											value={question}
											onChange={(e) => setQuestion(e.target.value)}
											placeholder="How can I create an invoice in Amdaani?"
										/>
									</div>

									<div className="space-y-2">
										<Label htmlFor="faq-answer">Answer</Label>
										<textarea
											id="faq-answer"
											value={answer}
											onChange={(e) => setAnswer(e.target.value)}
											placeholder="Go to Dashboard -> Click on Create Invoice -> Fill details -> Save."
											className="min-h-32 w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none"
										/>
									</div>

									<Button className="w-full" onClick={handleSaveFaq} disabled={submitting}>
										{submitting
											? editMode
												? "Updating..."
												: "Creating..."
											: editMode
											? "Update FAQ"
											: "Save FAQ"}
									</Button>
								</div>
							</DialogContent>
						</Dialog>
					</div>
				</div>

				{error ? (
					<div className="text-center text-destructive">
						{error}
						<Button onClick={fetchFaqs} className="ml-4" variant="outline">
							Retry
						</Button>
					</div>
				) : (
					<div className="rounded-md border">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Question</TableHead>
									<TableHead>Answer</TableHead>
									<TableHead>Created</TableHead>
									<TableHead>Updated</TableHead>
									<TableHead>Actions</TableHead>
								</TableRow>
							</TableHeader>

							<TableBody>
								{loading ? (
									<TableRow>
										<TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
											Loading FAQs...
										</TableCell>
									</TableRow>
								) : filteredFaqs.length === 0 ? (
									<TableRow>
										<TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
											No FAQs found
										</TableCell>
									</TableRow>
								) : (
									filteredFaqs.map((faq) => (
										<TableRow key={faq._id}>
											<TableCell className="max-w-[320px] whitespace-normal font-medium">
												{faq.question}
											</TableCell>
											<TableCell className="max-w-[460px] whitespace-normal">
												{faq.answer}
											</TableCell>
											<TableCell>{formatDate(faq.createdAt)}</TableCell>
											<TableCell>{formatDate(faq.updatedAt)}</TableCell>
											<TableCell>
												<div className="flex items-center gap-2">
													<Button
														size="icon"
														variant="outline"
														onClick={() => handleOpenEdit(faq)}
													>
														<Pencil className="h-4 w-4" />
													</Button>
													<Button
														size="icon"
														variant="destructive"
														onClick={() => handleDeleteFaq(faq._id)}
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
