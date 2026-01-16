import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageToggle from "@/components/LanguageToggle";

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

const BarRegistration = () => {
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [barName, setBarName] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const [capacity, setCapacity] = useState("");
  const [dashboardPassword, setDashboardPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");

  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  const [includeCoupon, setIncludeCoupon] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscountType, setCouponDiscountType] = useState<"percent" | "fixed">("percent");
  const [couponDiscountValue, setCouponDiscountValue] = useState("");
  const [couponUsageLimit, setCouponUsageLimit] = useState("1");
  const [couponValidFrom, setCouponValidFrom] = useState("");
  const [couponValidTo, setCouponValidTo] = useState("");
  const [couponIsActive, setCouponIsActive] = useState(true);

  const [includeHappyHour, setIncludeHappyHour] = useState(false);
  const [happyHourDays, setHappyHourDays] = useState<number[]>([]);
  const [happyHourStart, setHappyHourStart] = useState("17:00");
  const [happyHourEnd, setHappyHourEnd] = useState("20:00");
  const [happyHourDiscountType, setHappyHourDiscountType] = useState<"percent" | "fixed">("percent");
  const [happyHourDiscountValue, setHappyHourDiscountValue] = useState("");
  const [happyHourIsActive, setHappyHourIsActive] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdBarId, setCreatedBarId] = useState<string | null>(null);

  const daysSummary = useMemo(() => {
    if (happyHourDays.length === 0) return isRTL ? "בחרו ימים" : "Select days";
    return daysOfWeekOptions
      .filter((day) => happyHourDays.includes(day.value))
      .map((day) => day.label)
      .join(", ");
  }, [happyHourDays, isRTL]);

  const isValidQrUrl = (value: string) => {
    try {
      const parsed = new URL(value);
      return ["http:", "https:", "ftp:"].includes(parsed.protocol);
    } catch {
      return false;
    }
  };

  const isValidPhone = (value: string) => /^\+?[0-9\s-]{6,20}$/.test(value);

  const latNumber = Number(latitude);
  const lngNumber = Number(longitude);
  const isValidLocation =
    Number.isFinite(latNumber) &&
    Number.isFinite(lngNumber) &&
    latNumber >= -90 &&
    latNumber <= 90 &&
    lngNumber >= -180 &&
    lngNumber <= 180;

  const isPasswordValid = dashboardPassword.trim().length >= 6 && dashboardPassword === confirmPassword;
  const isCouponValid = !includeCoupon || (!!couponCode.trim() && !!couponDiscountValue);
  const isHappyHourValid =
    !includeHappyHour || (happyHourDays.length > 0 && !!happyHourDiscountValue && !!happyHourStart && !!happyHourEnd);

  const fetchLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: isRTL ? "אין תמיכה במיקום" : "Location unavailable",
        description: isRTL ? "הדפדפן לא תומך בגישה למיקום." : "Your browser does not support geolocation.",
        variant: "destructive",
      });
      return;
    }
    setIsFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(String(position.coords.latitude));
        setLongitude(String(position.coords.longitude));
        setIsFetchingLocation(false);
      },
      () => {
        setIsFetchingLocation(false);
        toast({
          title: isRTL ? "לא הצלחנו למשוך מיקום" : "Failed to get location",
          description: isRTL ? "אפשר להזין ידנית את הקואורדינטות." : "You can enter coordinates manually.",
          variant: "destructive",
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };

  const handleSubmit = async () => {
    if (!barName.trim() || !dashboardPassword.trim() || !ownerPhone.trim()) {
      toast({
        title: isRTL ? "חסרים פרטים" : "Missing required fields",
        description: isRTL
          ? "שם בר, טלפון בעלים וסיסמה הם חובה."
          : "Bar name, owner phone, and password are required.",
        variant: "destructive",
      });
      return;
    }

    if (qrUrl.trim() && !isValidQrUrl(qrUrl.trim())) {
      toast({
        title: isRTL ? "קישור QR לא תקין" : "Invalid QR URL",
        description: isRTL ? "יש להזין קישור מלא שמתחיל ב-http." : "Please enter a valid URL starting with http.",
        variant: "destructive",
      });
      return;
    }

    if (!isValidPhone(ownerPhone.trim())) {
      toast({
        title: isRTL ? "מספר טלפון לא תקין" : "Invalid phone number",
        description: isRTL ? "יש להזין מספר תקין." : "Please enter a valid phone number.",
        variant: "destructive",
      });
      return;
    }

    if (!isPasswordValid) {
      toast({
        title: isRTL ? "סיסמה לא תקינה" : "Invalid password",
        description: isRTL
          ? "סיסמה חייבת להיות לפחות 6 תווים והאימות צריך להתאים."
          : "Password must be at least 6 characters and match confirmation.",
        variant: "destructive",
      });
      return;
    }

    if (!isValidLocation) {
      toast({
        title: isRTL ? "מיקום לא תקין" : "Invalid location",
        description: isRTL ? "יש להזין קואורדינטות תקינות." : "Please enter valid coordinates.",
        variant: "destructive",
      });
      return;
    }

    if (!isCouponValid) {
      toast({
        title: isRTL ? "קופון לא תקין" : "Invalid coupon",
        description: isRTL ? "יש להשלים קוד והנחה לקופון." : "Please enter code and discount for the coupon.",
        variant: "destructive",
      });
      return;
    }

    if (!isHappyHourValid) {
      toast({
        title: isRTL ? "האפי האוור לא תקין" : "Invalid happy hour",
        description: isRTL ? "בחרו ימים והזינו הנחה." : "Select days and enter a discount.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const barPayload = {
        barName: barName.trim(),
        qrUrl: qrUrl.trim() || undefined,
        capacity: capacity ? Number(capacity) : 0,
        location: {
          type: "Point",
          coordinates: [lngNumber, latNumber],
        },
        dashboardPassword: dashboardPassword.trim(),
        ownerPhone: ownerPhone.trim(),
      };

      const response = await fetch(`${API_BASE}/api/bar/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(barPayload),
      });

      if (!response.ok) {
        throw new Error(isRTL ? "יצירת הבר נכשלה" : "Failed to create bar");
      }

      const newBar = await response.json();
      setCreatedBarId(newBar._id);

      if (includeCoupon && couponCode.trim() && couponDiscountValue) {
        await fetch(`${API_BASE}/api/bar/${newBar._id}/coupons`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: couponCode.trim(),
            discountType: couponDiscountType,
            discountValue: Number(couponDiscountValue),
            usageLimit: Number(couponUsageLimit) || 1,
            validFrom: couponValidFrom ? new Date(couponValidFrom).toISOString() : null,
            validTo: couponValidTo ? new Date(couponValidTo).toISOString() : null,
            isActive: couponIsActive,
          }),
        });
      }

      if (includeHappyHour && happyHourDays.length > 0 && happyHourDiscountValue) {
        await fetch(`${API_BASE}/api/bar/${newBar._id}/happy-hours`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            daysOfWeek: happyHourDays,
            startTime: happyHourStart,
            endTime: happyHourEnd,
            discountType: happyHourDiscountType,
            discountValue: Number(happyHourDiscountValue),
            isActive: happyHourIsActive,
          }),
        });
      }

      toast({
        title: isRTL ? "בר נוסף בהצלחה" : "Bar created",
        description: isRTL ? "הבר נוסף למערכת." : "The bar has been added successfully.",
      });
    } catch (error) {
      toast({
        title: isRTL ? "שגיאה" : "Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <LanguageToggle />
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <header className="flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {isRTL ? "הרשמת בר חדש" : "Register a New Bar"}
            </p>
            <h1 className="text-3xl font-black text-foreground">
              {isRTL ? "טופס הרשמה מתקדם" : "Advanced Registration Form"}
            </h1>
          </div>
          <Button asChild variant="outline">
            <Link to="/dashboard">{isRTL ? "חזרה לדשבורד" : "Back to Dashboard"}</Link>
          </Button>
        </header>

        {createdBarId && (
          <Card>
            <CardHeader>
              <CardTitle>{isRTL ? "בר נוצר בהצלחה" : "Bar Created"}</CardTitle>
              <CardDescription>
                {isRTL ? "שמרו את מזהה הבר לצורך התחברות." : "Save this Bar ID for login."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary">Bar ID: {createdBarId}</Badge>
              <div className="mt-4">
                <Button onClick={() => navigate("/dashboard")}>
                  {isRTL ? "חזרה להתחברות" : "Go to Login"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>{isRTL ? "פרטי חובה" : "Required Details"}</CardTitle>
              <CardDescription>
                {isRTL
                  ? "שם בר, קישור QR, מיקום וסיסמת כניסה."
                  : "Bar name, QR URL, location, and a dashboard password."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  {isRTL ? "שם הבר" : "Bar Name"}
                </label>
                <Input value={barName} onChange={(event) => setBarName(event.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  {isRTL ? "קישור QR (אופציונלי)" : "QR URL (optional)"}
                </label>
                <Input value={qrUrl} onChange={(event) => setQrUrl(event.target.value)} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  {isRTL ? "סיסמת דשבורד" : "Dashboard Password"}
                </label>
                <Input
                  type="password"
                  value={dashboardPassword}
                  onChange={(event) => setDashboardPassword(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  {isRTL ? "אימות סיסמה" : "Confirm Password"}
                </label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  {isRTL ? "טלפון בעל הבר" : "Owner Phone"}
                </label>
                <Input value={ownerPhone} onChange={(event) => setOwnerPhone(event.target.value)} placeholder="+972..." />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  {isRTL ? "קיבולת (אופציונלי)" : "Capacity (optional)"}
                </label>
                <Input
                  type="number"
                  min="0"
                  value={capacity}
                  onChange={(event) => setCapacity(event.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{isRTL ? "מיקום הבר" : "Bar Location"}</CardTitle>
              <CardDescription>
                {isRTL ? "אפשר למשוך מהמכשיר או להזין ידנית." : "Use device location or enter manually."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" onClick={fetchLocation} disabled={isFetchingLocation}>
                {isFetchingLocation ? (isRTL ? "מאתר מיקום..." : "Fetching...") : (isRTL ? "משוך מיקום" : "Use My Location")}
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">{isRTL ? "קו רוחב" : "Latitude"}</label>
                  <Input value={latitude} onChange={(event) => setLatitude(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">{isRTL ? "קו אורך" : "Longitude"}</label>
                  <Input value={longitude} onChange={(event) => setLongitude(event.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{isRTL ? "קופון פתיחה" : "Initial Coupon"}</CardTitle>
              <CardDescription>
                {isRTL ? "אפשר להוסיף קופון מיד עם יצירת הבר." : "Optionally add a coupon on creation."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">{isRTL ? "הוסף קופון" : "Add Coupon"}</p>
                  <p className="text-xs text-muted-foreground">
                    {isRTL ? "קופון ראשון שיופיע למשתמשים." : "First coupon for users."}
                  </p>
                </div>
                <Switch checked={includeCoupon} onCheckedChange={setIncludeCoupon} />
              </div>
              {includeCoupon && (
                <div className="space-y-4">
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
                    <Input type="number" min="0" value={couponDiscountValue} onChange={(event) => setCouponDiscountValue(event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">{isRTL ? "מגבלת שימוש" : "Usage Limit"}</label>
                    <Input type="number" min="1" value={couponUsageLimit} onChange={(event) => setCouponUsageLimit(event.target.value)} />
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
                        {isRTL ? "הצג את הקופון למשתמשים." : "Show this coupon to users."}
                      </p>
                    </div>
                    <Switch checked={couponIsActive} onCheckedChange={setCouponIsActive} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{isRTL ? "האפי האוור פתיחה" : "Initial Happy Hour"}</CardTitle>
              <CardDescription>
                {isRTL ? "הוספת חלון הנחה מתוזמן." : "Add a scheduled discount window."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">{isRTL ? "הוסף האפי האוור" : "Add Happy Hour"}</p>
                  <p className="text-xs text-muted-foreground">
                    {isRTL ? "הופעה אוטומטית בלוח." : "Auto-shows in the schedule."}
                  </p>
                </div>
                <Switch checked={includeHappyHour} onCheckedChange={setIncludeHappyHour} />
              </div>
              {includeHappyHour && (
                <div className="space-y-4">
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
                    <p className="text-xs text-muted-foreground">{daysSummary}</p>
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
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !barName.trim() || !dashboardPassword.trim() || !ownerPhone.trim()}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? (isRTL ? "שומר..." : "Saving...") : (isRTL ? "הוסף בר" : "Add Bar")}
          </Button>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link to="/dashboard">{isRTL ? "ביטול" : "Cancel"}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BarRegistration;
