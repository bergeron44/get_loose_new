import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageToggle from "@/components/LanguageToggle";
import { Link } from "react-router-dom";

const API_BASE = import.meta.env.VITE_SUPABASE_URL || "";

const daysOfWeekOptions = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

type BarData = {
  _id: string;
  barName: string;
  gameStats?: {
    [key: string]: number | undefined;
  };
  appEntryCount?: number;
  appEntryLogs?: Array<{ enteredAt?: string; ipAddress?: string }>;
  gamePlayLogs?: Array<{ gameType: string; startedAt?: string; ipAddress?: string }>;
};

type Coupon = {
  _id: string;
  code: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  isActive: boolean;
  isRedeemed: boolean;
  usageLimit: number;
  usageCount: number;
  validFrom?: string | null;
  validTo?: string | null;
  createdAt?: string;
};

type HappyHour = {
  _id: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  isActive: boolean;
  createdAt?: string;
};

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
};

const formatTimeRange = (start: string, end: string) => `${start} - ${end}`;

const BarDashboard = () => {
  const { toast } = useToast();
  const { isRTL } = useLanguage();
  const [barId, setBarId] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [bar, setBar] = useState<BarData | null>(null);
  const [isLoadingBar, setIsLoadingBar] = useState(false);

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [happyHours, setHappyHours] = useState<HappyHour[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const [couponCode, setCouponCode] = useState("");
  const [couponDiscountType, setCouponDiscountType] = useState<"percent" | "fixed">("percent");
  const [couponDiscountValue, setCouponDiscountValue] = useState("");
  const [couponUsageLimit, setCouponUsageLimit] = useState("1");
  const [couponValidFrom, setCouponValidFrom] = useState("");
  const [couponValidTo, setCouponValidTo] = useState("");
  const [couponIsActive, setCouponIsActive] = useState(true);
  const [isCreatingCoupon, setIsCreatingCoupon] = useState(false);

  const [happyHourDays, setHappyHourDays] = useState<number[]>([]);
  const [happyHourStart, setHappyHourStart] = useState("17:00");
  const [happyHourEnd, setHappyHourEnd] = useState("20:00");
  const [happyHourDiscountType, setHappyHourDiscountType] = useState<"percent" | "fixed">("percent");
  const [happyHourDiscountValue, setHappyHourDiscountValue] = useState("");
  const [happyHourIsActive, setHappyHourIsActive] = useState(true);
  const [isCreatingHappyHour, setIsCreatingHappyHour] = useState(false);

  const gameStats = bar?.gameStats || {};
  const totalGames = Object.values(gameStats).reduce((sum, value) => sum + (value || 0), 0);
  const gameStatsList = useMemo(() => {
    return Object.entries(gameStats)
      .map(([key, value]) => ({ key, value: value || 0 }))
      .sort((a, b) => b.value - a.value);
  }, [gameStats]);
  const appEntryLogs = (bar?.appEntryLogs || []).slice().reverse().slice(0, 10);
  const gamePlayLogs = (bar?.gamePlayLogs || []).slice().reverse().slice(0, 10);

  const loginBar = useCallback(async (password: string) => {
    if (!password) return null;
    const response = await fetch(`${API_BASE}/api/bar/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!response.ok) {
      throw new Error("Invalid password");
    }
    return (await response.json()) as BarData;
  }, []);

  const fetchCoupons = useCallback(async (barIdToFetch: string) => {
    const response = await fetch(`${API_BASE}/api/coupons/bar/${barIdToFetch}`);
    if (!response.ok) {
      throw new Error("Failed to load coupons");
    }
    return (await response.json()) as Coupon[];
  }, []);

  const fetchHappyHours = useCallback(async (barIdToFetch: string) => {
    const response = await fetch(`${API_BASE}/api/happy-hours/bar/${barIdToFetch}`);
    if (!response.ok) {
      throw new Error("Failed to load happy hours");
    }
    return (await response.json()) as HappyHour[];
  }, []);

  const refreshData = useCallback(
    async (barIdToFetch: string) => {
      setIsLoadingData(true);
      try {
        const [couponsData, happyHoursData] = await Promise.all([
          fetchCoupons(barIdToFetch),
          fetchHappyHours(barIdToFetch),
        ]);
        setCoupons(couponsData);
        setHappyHours(happyHoursData);
      } catch (error) {
        toast({
          title: "Failed to load dashboard data",
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "destructive",
        });
      } finally {
        setIsLoadingData(false);
      }
    },
    [fetchCoupons, fetchHappyHours, toast],
  );

  useEffect(() => {
    if (!barId) return;
    refreshData(barId);
  }, [barId, refreshData]);

  const handleAccess = async () => {
    if (!passwordInput.trim()) return;
    setIsLoadingBar(true);
    try {
      const data = await loginBar(passwordInput.trim());
      setBarId(data._id);
      setBar(data);
      setPasswordInput("");
    } catch (error) {
      toast({
        title: isRTL ? "סיסמה שגויה" : "Invalid password",
        description: isRTL ? "בדקו את הסיסמה ונסו שוב." : "Please check the password and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingBar(false);
    }
  };

  const handleLogout = () => {
    setBarId("");
    setBar(null);
    setCoupons([]);
    setHappyHours([]);
    setPasswordInput("");
  };

  const createCoupon = async () => {
    if (!barId || !couponCode.trim() || !couponDiscountValue) return;
    setIsCreatingCoupon(true);
    try {
      const payload = {
        code: couponCode.trim(),
        discountType: couponDiscountType,
        discountValue: Number(couponDiscountValue),
        usageLimit: Number(couponUsageLimit) || 1,
        validFrom: couponValidFrom ? new Date(couponValidFrom).toISOString() : null,
        validTo: couponValidTo ? new Date(couponValidTo).toISOString() : null,
        isActive: couponIsActive,
      };

      const response = await fetch(`${API_BASE}/api/bar/${barId}/coupons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to create coupon");
      }

      toast({ title: "Coupon created", description: "Your coupon is ready to use." });
      setCouponCode("");
      setCouponDiscountValue("");
      setCouponUsageLimit("1");
      setCouponValidFrom("");
      setCouponValidTo("");
      setCouponIsActive(true);
      await refreshData(barId);
    } catch (error) {
      toast({
        title: "Failed to create coupon",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsCreatingCoupon(false);
    }
  };

  const deleteCoupon = async (couponId: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/coupons/${couponId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete coupon");
      }
      toast({ title: "Coupon deleted" });
      await refreshData(barId);
    } catch (error) {
      toast({
        title: "Failed to delete coupon",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const toggleCouponActive = async (coupon: Coupon) => {
    try {
      const response = await fetch(`${API_BASE}/api/coupons/${coupon._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !coupon.isActive }),
      });
      if (!response.ok) {
        throw new Error("Failed to update coupon");
      }
      await refreshData(barId);
    } catch (error) {
      toast({
        title: "Failed to update coupon",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const createHappyHour = async () => {
    if (!barId || happyHourDays.length === 0 || !happyHourStart || !happyHourEnd || !happyHourDiscountValue) {
      return;
    }
    setIsCreatingHappyHour(true);
    try {
      const payload = {
        daysOfWeek: happyHourDays,
        startTime: happyHourStart,
        endTime: happyHourEnd,
        discountType: happyHourDiscountType,
        discountValue: Number(happyHourDiscountValue),
        isActive: happyHourIsActive,
      };

      const response = await fetch(`${API_BASE}/api/bar/${barId}/happy-hours`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to create happy hour");
      }

      toast({ title: "Happy hour created", description: "Schedule saved successfully." });
      setHappyHourDays([]);
      setHappyHourStart("17:00");
      setHappyHourEnd("20:00");
      setHappyHourDiscountValue("");
      setHappyHourIsActive(true);
      await refreshData(barId);
    } catch (error) {
      toast({
        title: "Failed to create happy hour",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsCreatingHappyHour(false);
    }
  };

  const deleteHappyHour = async (happyHourId: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/happy-hours/${happyHourId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete happy hour");
      }
      toast({ title: "Happy hour deleted" });
      await refreshData(barId);
    } catch (error) {
      toast({
        title: "Failed to delete happy hour",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const toggleHappyHourActive = async (happyHour: HappyHour) => {
    try {
      const response = await fetch(`${API_BASE}/api/happy-hours/${happyHour._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !happyHour.isActive }),
      });
      if (!response.ok) {
        throw new Error("Failed to update happy hour");
      }
      await refreshData(barId);
    } catch (error) {
      toast({
        title: "Failed to update happy hour",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const daysSummary = useMemo(() => {
    if (happyHourDays.length === 0) return "Select days";
    return daysOfWeekOptions
      .filter((day) => happyHourDays.includes(day.value))
      .map((day) => day.label)
      .join(", ");
  }, [happyHourDays]);

  const couponFormDisabled = isCreatingCoupon || !couponCode.trim() || !couponDiscountValue;
  const happyHourFormDisabled =
    isCreatingHappyHour || happyHourDays.length === 0 || !happyHourStart || !happyHourEnd || !happyHourDiscountValue;

  if (!barId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <LanguageToggle />
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <CardTitle>{isRTL ? "דשבורד לבעל העסק" : "Bar Dashboard"}</CardTitle>
            <CardDescription>
              {isRTL ? "הזינו סיסמה כדי להיכנס לדשבורד." : "Enter your password to access the dashboard."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground" htmlFor="bar-password-input">
                {isRTL ? "סיסמה" : "Password"}
              </label>
              <Input
                id="bar-password-input"
                type="password"
                value={passwordInput}
                onChange={(event) => setPasswordInput(event.target.value)}
                placeholder={isRTL ? "הקלידו סיסמה" : "Enter your dashboard password"}
              />
            </div>
            <div className="space-y-3">
              <Button
                className="w-full"
                onClick={handleAccess}
                disabled={!passwordInput.trim() || isLoadingBar}
              >
                {isLoadingBar ? (isRTL ? "בודק..." : "Checking...") : (isRTL ? "כניסה לדשבורד" : "Access Dashboard")}
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link to="/dashboard/register">{isRTL ? "הוסף בר חדש" : "Add a New Bar"}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <LanguageToggle />
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{isRTL ? "דשבורד לבעל העסק" : "Bar Dashboard"}</p>
            <h1 className="text-3xl font-black text-foreground">{bar?.barName || "Your Venue"}</h1>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary">Bar ID: {barId}</Badge>
            <Button asChild variant="secondary">
              <Link to="/dashboard/register">{isRTL ? "הוסף בר" : "Add Bar"}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/questions-dashboard">{isRTL ? "ניהול שאלות" : "Questions"}</Link>
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              {isRTL ? "התנתק" : "Log out"}
            </Button>
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">{isRTL ? "משחקים ששוחקו" : "Games Played"}</CardTitle>
              <CardDescription>{isRTL ? "מדד מעורבות בתוך הבר" : "Total engagement inside your bar"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-3xl font-black">{totalGames}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">{isRTL ? "כניסות לאפליקציה" : "App Entries"}</CardTitle>
              <CardDescription>{isRTL ? "כמה משתמשים נכנסו דרך הבר" : "Users detected at this bar"}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-black">{bar?.appEntryCount || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">{isRTL ? "קופונים פעילים" : "Active Coupons"}</CardTitle>
              <CardDescription>{isRTL ? "מבצעים זמינים כרגע" : "Currently enabled offers"}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-black">
                {coupons.filter((coupon) => coupon.isActive && !coupon.isRedeemed).length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">{isRTL ? "האפי האוור" : "Happy Hours"}</CardTitle>
              <CardDescription>{isRTL ? "חלונות הנחה מתוזמנים" : "Scheduled discount windows"}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-black">{happyHours.length}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="coupons" className="space-y-4">
          <TabsList>
            <TabsTrigger value="coupons">{isRTL ? "קופונים" : "Coupons"}</TabsTrigger>
            <TabsTrigger value="happy-hours">{isRTL ? "האפי האוור" : "Happy Hours"}</TabsTrigger>
            <TabsTrigger value="analytics">{isRTL ? "אנליטיקס" : "Analytics"}</TabsTrigger>
          </TabsList>

          <TabsContent value="coupons">
            <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
              <Card>
                <CardHeader>
                  <CardTitle>Create Coupon</CardTitle>
                  <CardDescription>
                    {isRTL ? "צרו קופונים עם קוד ייחודי." : "Offer discounts with unique codes."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">{isRTL ? "קוד" : "Code"}</label>
                    <Input value={couponCode} onChange={(event) => setCouponCode(event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">{isRTL ? "סוג הנחה" : "Discount Type"}</label>
                    <Select value={couponDiscountType} onValueChange={(value) => setCouponDiscountType(value as "percent" | "fixed")}>
                      <SelectTrigger>
                        <SelectValue placeholder={isRTL ? "בחרו סוג" : "Select type"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percent">{isRTL ? "אחוזים (%)" : "Percent (%)"}</SelectItem>
                        <SelectItem value="fixed">{isRTL ? "סכום קבוע (₪)" : "Fixed (₪)"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">{isRTL ? "ערך הנחה" : "Discount Value"}</label>
                    <Input
                      type="number"
                      min="0"
                      value={couponDiscountValue}
                      onChange={(event) => setCouponDiscountValue(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">{isRTL ? "מגבלת שימוש" : "Usage Limit"}</label>
                    <Input
                      type="number"
                      min="1"
                      value={couponUsageLimit}
                      onChange={(event) => setCouponUsageLimit(event.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">{isRTL ? "בתוקף מ־" : "Valid From"}</label>
                      <Input type="date" value={couponValidFrom} onChange={(event) => setCouponValidFrom(event.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">{isRTL ? "בתוקף עד־" : "Valid To"}</label>
                      <Input type="date" value={couponValidTo} onChange={(event) => setCouponValidTo(event.target.value)} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">{isRTL ? "פעיל" : "Active"}</p>
                      <p className="text-xs text-muted-foreground">
                        {isRTL ? "הציגו את הקופון בבר." : "Show this coupon in your bar offers."}
                      </p>
                    </div>
                    <Switch checked={couponIsActive} onCheckedChange={setCouponIsActive} />
                  </div>
                  <Button className="w-full" onClick={createCoupon} disabled={couponFormDisabled}>
                    {isCreatingCoupon ? (isRTL ? "יוצר..." : "Creating...") : (isRTL ? "צור קופון" : "Create Coupon")}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{isRTL ? "רשימת קופונים" : "Coupon List"}</CardTitle>
                  <CardDescription>
                    {isRTL ? "ניהול קופונים פעילים וממומשים." : "Manage active and redeemed codes."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingData ? (
                    <p className="text-sm text-muted-foreground">{isRTL ? "טוען קופונים..." : "Loading coupons..."}</p>
                  ) : coupons.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{isRTL ? "אין קופונים עדיין." : "No coupons yet."}</p>
                  ) : (
                    <div className="w-full overflow-x-auto">
                      <Table className="min-w-[640px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead>{isRTL ? "קוד" : "Code"}</TableHead>
                          <TableHead>{isRTL ? "הנחה" : "Discount"}</TableHead>
                          <TableHead>{isRTL ? "סטטוס" : "Status"}</TableHead>
                          <TableHead>{isRTL ? "שימוש" : "Usage"}</TableHead>
                          <TableHead>{isRTL ? "תוקף" : "Validity"}</TableHead>
                          <TableHead className="text-right">{isRTL ? "פעולות" : "Actions"}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {coupons.map((coupon) => (
                          <TableRow key={coupon._id}>
                            <TableCell className="font-medium">{coupon.code}</TableCell>
                            <TableCell>
                              {coupon.discountType === "percent"
                                ? `${coupon.discountValue}%`
                                : `₪${coupon.discountValue}`}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Badge variant={coupon.isActive ? "secondary" : "outline"}>
                                  {coupon.isActive ? (isRTL ? "פעיל" : "Active") : (isRTL ? "מושהה" : "Paused")}
                                </Badge>
                                {coupon.isRedeemed && (
                                  <Badge variant="destructive">{isRTL ? "מומש" : "Redeemed"}</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {coupon.usageCount}/{coupon.usageLimit}
                            </TableCell>
                            <TableCell>
                              {formatDate(coupon.validFrom)} → {formatDate(coupon.validTo)}
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => toggleCouponActive(coupon)}
                              >
                                {coupon.isActive ? (isRTL ? "כבה" : "Disable") : (isRTL ? "הפעל" : "Enable")}
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => deleteCoupon(coupon._id)}>
                                {isRTL ? "מחק" : "Delete"}
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
          </TabsContent>

          <TabsContent value="happy-hours">
            <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
              <Card>
                <CardHeader>
                  <CardTitle>{isRTL ? "צור האפי האוור" : "Create Happy Hour"}</CardTitle>
                  <CardDescription>
                    {isRTL ? "הנחות אוטומטיות לפי ימים ושעות." : "Automate time-based discounts."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">{isRTL ? "ימי השבוע" : "Days of Week"}</p>
                    <div className="flex flex-wrap gap-3">
                      {daysOfWeekOptions.map((day) => (
                        <label key={day.value} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={happyHourDays.includes(day.value)}
                            onCheckedChange={(checked) => {
                              setHappyHourDays((prev) =>
                                checked ? [...prev, day.value] : prev.filter((value) => value !== day.value),
                              );
                            }}
                          />
                          {day.label}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">{isRTL ? "שעת התחלה" : "Start Time"}</label>
                      <Input type="time" value={happyHourStart} onChange={(event) => setHappyHourStart(event.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">{isRTL ? "שעת סיום" : "End Time"}</label>
                      <Input type="time" value={happyHourEnd} onChange={(event) => setHappyHourEnd(event.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">{isRTL ? "סוג הנחה" : "Discount Type"}</label>
                    <Select value={happyHourDiscountType} onValueChange={(value) => setHappyHourDiscountType(value as "percent" | "fixed")}>
                      <SelectTrigger>
                        <SelectValue placeholder={isRTL ? "בחרו סוג" : "Select type"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percent">{isRTL ? "אחוזים (%)" : "Percent (%)"}</SelectItem>
                        <SelectItem value="fixed">{isRTL ? "סכום קבוע (₪)" : "Fixed (₪)"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">{isRTL ? "ערך הנחה" : "Discount Value"}</label>
                    <Input
                      type="number"
                      min="0"
                      value={happyHourDiscountValue}
                      onChange={(event) => setHappyHourDiscountValue(event.target.value)}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">{isRTL ? "פעיל" : "Active"}</p>
                      <p className="text-xs text-muted-foreground">
                        {isRTL ? "הפעלת ההאפי האוור מיד." : "Enable this happy hour immediately."}
                      </p>
                    </div>
                    <Switch checked={happyHourIsActive} onCheckedChange={setHappyHourIsActive} />
                  </div>
                  <Button className="w-full" onClick={createHappyHour} disabled={happyHourFormDisabled}>
                    {isCreatingHappyHour ? (isRTL ? "שומר..." : "Saving...") : (isRTL ? "צור האפי האוור" : "Create Happy Hour")}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{isRTL ? "רשימת האפי האוור" : "Happy Hour List"}</CardTitle>
                  <CardDescription>{daysSummary}</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingData ? (
                    <p className="text-sm text-muted-foreground">{isRTL ? "טוען האפי האוור..." : "Loading happy hours..."}</p>
                  ) : happyHours.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {isRTL ? "אין האפי האוור עדיין." : "No happy hour schedules yet."}
                    </p>
                  ) : (
                    <div className="w-full overflow-x-auto">
                      <Table className="min-w-[560px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead>{isRTL ? "ימים" : "Days"}</TableHead>
                          <TableHead>{isRTL ? "שעות" : "Time"}</TableHead>
                          <TableHead>{isRTL ? "הנחה" : "Discount"}</TableHead>
                          <TableHead>{isRTL ? "סטטוס" : "Status"}</TableHead>
                          <TableHead className="text-right">{isRTL ? "פעולות" : "Actions"}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {happyHours.map((happyHour) => (
                          <TableRow key={happyHour._id}>
                            <TableCell>
                              {happyHour.daysOfWeek
                                .map((value) => daysOfWeekOptions.find((day) => day.value === value)?.label)
                                .filter(Boolean)
                                .join(", ")}
                            </TableCell>
                            <TableCell>{formatTimeRange(happyHour.startTime, happyHour.endTime)}</TableCell>
                            <TableCell>
                              {happyHour.discountType === "percent"
                                ? `${happyHour.discountValue}%`
                                : `₪${happyHour.discountValue}`}
                            </TableCell>
                            <TableCell>
                              <Badge variant={happyHour.isActive ? "secondary" : "outline"}>
                                {happyHour.isActive ? (isRTL ? "פעיל" : "Active") : (isRTL ? "מושהה" : "Paused")}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => toggleHappyHourActive(happyHour)}
                              >
                                {happyHour.isActive ? (isRTL ? "כבה" : "Disable") : (isRTL ? "הפעל" : "Enable")}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteHappyHour(happyHour._id)}
                              >
                                {isRTL ? "מחק" : "Delete"}
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
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>{isRTL ? "משחקים לפי סוג" : "Games by Type"}</CardTitle>
                  <CardDescription>
                    {isRTL ? "כמה פעמים נבחר כל משחק." : "How many times each game was selected."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {gameStatsList.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {isRTL ? "אין נתונים עדיין." : "No data yet."}
                    </p>
                  ) : (
                    <div className="w-full overflow-x-auto">
                      <Table className="min-w-[360px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead>{isRTL ? "משחק" : "Game"}</TableHead>
                          <TableHead>{isRTL ? "כמות" : "Count"}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {gameStatsList.map((item) => (
                          <TableRow key={item.key}>
                            <TableCell className="font-medium">{item.key}</TableCell>
                            <TableCell>{item.value}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{isRTL ? "כניסות אחרונות לאפליקציה" : "Recent App Entries"}</CardTitle>
                  <CardDescription>
                    {isRTL ? "תאריך ושעה לפי זיהוי מיקום." : "Date/time captured on bar detection."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {appEntryLogs.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {isRTL ? "אין כניסות עדיין." : "No entries yet."}
                    </p>
                  ) : (
                    <div className="w-full overflow-x-auto">
                      <Table className="min-w-[420px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead>{isRTL ? "תאריך ושעה" : "Date & Time"}</TableHead>
                          <TableHead>{isRTL ? "IP" : "IP"}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {appEntryLogs.map((entry, index) => (
                          <TableRow key={`${entry.enteredAt || "entry"}-${index}`}>
                            <TableCell>{formatDateTime(entry.enteredAt)}</TableCell>
                            <TableCell>{entry.ipAddress || "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>{isRTL ? "כניסות למשחקים" : "Game Entry Logs"}</CardTitle>
                  <CardDescription>
                    {isRTL ? "נרשם ברגע בחירת המשחק." : "Captured at the moment a game is selected."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {gamePlayLogs.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {isRTL ? "אין נתונים עדיין." : "No data yet."}
                    </p>
                  ) : (
                    <div className="w-full overflow-x-auto">
                      <Table className="min-w-[520px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead>{isRTL ? "משחק" : "Game"}</TableHead>
                          <TableHead>{isRTL ? "תאריך ושעה" : "Date & Time"}</TableHead>
                          <TableHead>{isRTL ? "IP" : "IP"}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {gamePlayLogs.map((entry, index) => (
                          <TableRow key={`${entry.startedAt || "game"}-${index}`}>
                            <TableCell className="font-medium">{entry.gameType}</TableCell>
                            <TableCell>{formatDateTime(entry.startedAt)}</TableCell>
                            <TableCell>{entry.ipAddress || "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default BarDashboard;
