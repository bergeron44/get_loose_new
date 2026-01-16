import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageToggle from "@/components/LanguageToggle";

const API_BASE = import.meta.env.VITE_SUPABASE_URL || "";

type QuestionItem = {
  _id: string;
  question: string;
  punishment: string;
  questionEnglish?: string;
  punishmentEnglish?: string;
  category?: string;
  game?: string;
  difficult?: string;
  questionImage?: string;
  rate?: number;
  appearance?: number;
  successRate?: number;
};

type QuestionFormState = {
  question: string;
  punishment: string;
  questionEnglish: string;
  punishmentEnglish: string;
  category: string;
  game: string;
  difficult: string;
  questionImage: string;
  rate: string;
};

const emptyForm = (game: string): QuestionFormState => ({
  question: "",
  punishment: "",
  questionEnglish: "",
  punishmentEnglish: "",
  category: "",
  game: game || "",
  difficult: "",
  questionImage: "",
  rate: "",
});

const QuestionsDashboard = () => {
  const { isRTL } = useLanguage();
  const { toast } = useToast();

  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [games, setGames] = useState<string[]>([]);
  const [selectedGame, setSelectedGame] = useState("all");
  const [searchValue, setSearchValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const [formState, setFormState] = useState<QuestionFormState>(() => emptyForm(""));
  const [isSaving, setIsSaving] = useState(false);

  const loadGames = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/questions`);
      if (!response.ok) {
        throw new Error("Failed to fetch questions");
      }
      const data = (await response.json()) as QuestionItem[];
      const uniqueGames = Array.from(new Set(data.map((item) => item.game).filter(Boolean))) as string[];
      uniqueGames.sort();
      setGames(uniqueGames);
    } catch (error) {
      console.error(error);
      setGames([]);
    }
  }, []);

  const loadQuestions = useCallback(async () => {
    setIsLoading(true);
    try {
      const url =
        selectedGame === "all"
          ? `${API_BASE}/api/questions`
          : `${API_BASE}/api/questions/game/${encodeURIComponent(selectedGame)}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to load questions");
      }
      const data = (await response.json()) as QuestionItem[];
      setQuestions(data);
    } catch (error) {
      toast({
        title: isRTL ? "שגיאה בטעינה" : "Failed to load",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedGame, toast, isRTL]);

  useEffect(() => {
    loadGames();
  }, [loadGames]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const filteredQuestions = useMemo(() => {
    if (!searchValue.trim()) return questions;
    const needle = searchValue.toLowerCase();
    return questions.filter((item) =>
      [item.question, item.questionEnglish, item.punishment, item.punishmentEnglish, item.category, item.game]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle)),
    );
  }, [questions, searchValue]);

  const openCreateDialog = () => {
    setIsEditing(false);
    setActiveQuestionId(null);
    setFormState(emptyForm(selectedGame === "all" ? "" : selectedGame));
    setIsDialogOpen(true);
  };

  const openEditDialog = (question: QuestionItem) => {
    setIsEditing(true);
    setActiveQuestionId(question._id);
    setFormState({
      question: question.question || "",
      punishment: question.punishment || "",
      questionEnglish: question.questionEnglish || "",
      punishmentEnglish: question.punishmentEnglish || "",
      category: question.category || "",
      game: question.game || "",
      difficult: question.difficult || "",
      questionImage: question.questionImage || "",
      rate: typeof question.rate === "number" ? String(question.rate) : "",
    });
    setIsDialogOpen(true);
  };

  const updateForm = (key: keyof QuestionFormState, value: string) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!formState.question.trim() || !formState.punishment.trim()) {
      toast({
        title: isRTL ? "חסרים שדות" : "Missing fields",
        description: isRTL ? "שאלה ועונש הם חובה." : "Question and punishment are required.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        question: formState.question.trim(),
        punishment: formState.punishment.trim(),
        questionEnglish: formState.questionEnglish.trim(),
        punishmentEnglish: formState.punishmentEnglish.trim(),
        category: formState.category.trim(),
        game: formState.game.trim(),
        difficult: formState.difficult.trim(),
        questionImage: formState.questionImage.trim(),
        rate: formState.rate ? Number(formState.rate) : undefined,
      };

      if (isEditing && activeQuestionId) {
        const response = await fetch(`${API_BASE}/api/questions/update/${activeQuestionId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          throw new Error("Failed to update question");
        }
      } else {
        const response = await fetch(`${API_BASE}/api/questions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          throw new Error("Failed to create question");
        }
      }

      toast({
        title: isRTL ? "נשמר בהצלחה" : "Saved successfully",
        description: isRTL ? "הנתונים עודכנו." : "Question data updated.",
      });
      setIsDialogOpen(false);
      await loadQuestions();
      await loadGames();
    } catch (error) {
      toast({
        title: isRTL ? "שגיאה" : "Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <LanguageToggle />
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {isRTL ? "ניהול שאלות" : "Questions Manager"}
            </p>
            <h1 className="text-3xl font-black text-foreground">
              {isRTL ? "עריכת שאלות לפי משחק" : "Manage Questions by Game"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="outline">
              <Link to="/dashboard">{isRTL ? "חזרה לדשבורד" : "Back to Dashboard"}</Link>
            </Button>
            <Button onClick={openCreateDialog}>{isRTL ? "צור שאלה" : "Create Question"}</Button>
          </div>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>{isRTL ? "סינון וחיפוש" : "Filters & Search"}</CardTitle>
            <CardDescription>
              {isRTL ? "בחר משחק וחפש בתוכן השאלות." : "Select a game and search questions."}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-[220px_1fr_auto]">
            <Select value={selectedGame} onValueChange={setSelectedGame}>
              <SelectTrigger>
                <SelectValue placeholder={isRTL ? "בחר משחק" : "Select game"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isRTL ? "כל המשחקים" : "All games"}</SelectItem>
                {games.map((game) => (
                  <SelectItem key={game} value={game}>
                    {game}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder={isRTL ? "חיפוש חופשי..." : "Search..."}
            />
            <Button variant="outline" onClick={loadQuestions} disabled={isLoading}>
              {isLoading ? (isRTL ? "טוען..." : "Loading...") : (isRTL ? "רענן" : "Refresh")}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{isRTL ? "שאלות קיימות" : "Existing Questions"}</CardTitle>
            <CardDescription>
              {isRTL ? "לחיצה על עריכה תפתח את הטופס." : "Use edit to update question details."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">{isRTL ? "טוען שאלות..." : "Loading questions..."}</p>
            ) : filteredQuestions.length === 0 ? (
              <p className="text-sm text-muted-foreground">{isRTL ? "אין שאלות." : "No questions found."}</p>
            ) : (
              <div className="w-full overflow-x-auto">
                <Table className="min-w-[900px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>{isRTL ? "שאלה" : "Question"}</TableHead>
                      <TableHead>{isRTL ? "משחק" : "Game"}</TableHead>
                      <TableHead>{isRTL ? "קטגוריה" : "Category"}</TableHead>
                      <TableHead>{isRTL ? "קושי" : "Difficulty"}</TableHead>
                      <TableHead>{isRTL ? "דירוג" : "Rate"}</TableHead>
                      <TableHead className="text-right">{isRTL ? "פעולות" : "Actions"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredQuestions.map((item) => (
                      <TableRow key={item._id}>
                        <TableCell className="font-medium">
                          {item.question}
                          {item.questionEnglish && (
                            <p className="text-xs text-muted-foreground">{item.questionEnglish}</p>
                          )}
                        </TableCell>
                        <TableCell>{item.game || "-"}</TableCell>
                        <TableCell>{item.category || "-"}</TableCell>
                        <TableCell>{item.difficult || "-"}</TableCell>
                        <TableCell>{typeof item.rate === "number" ? item.rate : "-"}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" onClick={() => openEditDialog(item)}>
                            {isRTL ? "עריכה" : "Edit"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isEditing ? (isRTL ? "עריכת שאלה" : "Edit Question") : (isRTL ? "שאלה חדשה" : "New Question")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-muted-foreground">{isRTL ? "שאלה (HE)" : "Question (HE)"}</label>
              <Textarea value={formState.question} onChange={(event) => updateForm("question", event.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-muted-foreground">
                {isRTL ? "שאלה (EN)" : "Question (EN)"}
              </label>
              <Textarea
                value={formState.questionEnglish}
                onChange={(event) => updateForm("questionEnglish", event.target.value)}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-muted-foreground">{isRTL ? "עונש (HE)" : "Punishment (HE)"}</label>
              <Textarea value={formState.punishment} onChange={(event) => updateForm("punishment", event.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-muted-foreground">
                {isRTL ? "עונש (EN)" : "Punishment (EN)"}
              </label>
              <Textarea
                value={formState.punishmentEnglish}
                onChange={(event) => updateForm("punishmentEnglish", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">{isRTL ? "משחק" : "Game"}</label>
              <Input value={formState.game} onChange={(event) => updateForm("game", event.target.value)} />
              <Select value={formState.game || "custom"} onValueChange={(value) => updateForm("game", value)}>
                <SelectTrigger>
                  <SelectValue placeholder={isRTL ? "בחר משחק" : "Select game"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">{isRTL ? "מותאם ידנית" : "Custom"}</SelectItem>
                  {games.map((game) => (
                    <SelectItem key={game} value={game}>
                      {game}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">{isRTL ? "קטגוריה" : "Category"}</label>
              <Input value={formState.category} onChange={(event) => updateForm("category", event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">{isRTL ? "קושי" : "Difficulty"}</label>
              <Input value={formState.difficult} onChange={(event) => updateForm("difficult", event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">{isRTL ? "דירוג" : "Rate"}</label>
              <Input
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={formState.rate}
                onChange={(event) => updateForm("rate", event.target.value)}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-muted-foreground">{isRTL ? "קישור תמונה" : "Question Image URL"}</label>
              <Input
                value={formState.questionImage}
                onChange={(event) => updateForm("questionImage", event.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {isRTL ? "סגור" : "Close"}
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (isRTL ? "שומר..." : "Saving...") : (isRTL ? "שמור" : "Save")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuestionsDashboard;
