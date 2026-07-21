import { useEffect, useRef, useState, type FormEvent } from "react";
import hiveLogo from "./assets/logo@4x.png";
import hiveLogoSmall from "./assets/logo.png";
import {
  ArrowLeft,
  Bell,
  Camera,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  Eye,
  Globe2,
  Heart,
  Home,
  ImageIcon,
  LockKeyhole,
  LogOut,
  Mail,
  MapPin,
  MessageCircle,
  Mic,
  MoreHorizontal,
  Package,
  Plus,
  ReceiptText,
  Search,
  Send,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Smile,
  Sparkles,
  Star,
  Tag,
  Trash2,
  Truck,
  User,
  Wallet,
  X,
} from "lucide-react";

type Tab = "home" | "cart" | "post" | "messages" | "profile";
type AuthMode = "login" | "signup" | "verify" | "forgot" | "reset";
type UserInfo = {
  email?: string;
  name: string;
  school: string;
  grad: string;
  campus: string;
  avatar: string;
  gender: string;
  age: string;
  sign: string;
  interests: string;
  bio: string;
};

async function api(path: string, method = "GET", body?: unknown) {
  const response = await fetch(path, {
    method,
    credentials: "same-origin",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json();
  if (!response.ok) throw Object.assign(new Error(data.error || "Something went wrong."), { data });
  return data;
}

type Screen =
  | { type: "auth"; mode: AuthMode }
  | { type: "auth-legal"; title: "Terms of Service" | "Privacy Policy" }
  | { type: "main" }
  | { type: "search" }
  | { type: "product"; item: Product }
  | { type: "seller"; item: Product }
  | { type: "chat"; dm: DM }
  | { type: "post" }
  | { type: "post-review"; draft: Draft }
  | { type: "post-success" }
  | { type: "checkout"; buyNow?: Product }
  | { type: "checkout-success" }
  | { type: "edit-profile" }
  | { type: "profile-page"; title: string };

interface Product {
  id: string | number;
  title: string;
  price: number;
  images: string[];
  cardHeight: number;
  seller: string;
  sellerAvatar: string;
  sellerRating: number;
  location: string;
  posted: string;
  condition: string;
  category: string;
  description: string;
  school?: string;
  campus?: string;
  ownerId?: string;
}
interface CartItem {
  product: Product;
  qty: number;
}
interface Draft {
  title: string;
  description: string;
  price: string;
  category: string;
  condition: string;
  image: string;
}
interface DM {
  id: string | number;
  recipientId?: string;
  name: string;
  avatar: string;
  productId: string | number;
  product?: Product;
  last: string;
  time: string;
  unread: number;
  online: boolean;
}
interface ChatMessage {
  from: "me" | "them";
  text: string;
  time: string;
  read?: boolean;
}

function listingToProduct(listing: any): Product {
  return {
    id: String(listing.id),
    title: String(listing.title),
    price: Number(listing.price),
    images: Array.isArray(listing.images) && listing.images.length ? listing.images : [hiveLogo],
    cardHeight: 190,
    seller: String(listing.seller || "Hive student"),
    sellerAvatar: String(listing.sellerAvatar || "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=160&h=160&fit=crop"),
    sellerRating: Number(listing.sellerRating || 5),
    location: String(listing.location || "Campus"),
    posted: "Just listed",
    condition: String(listing.condition || "Good"),
    category: String(listing.category || "Other"),
    description: String(listing.description || ""),
    school: String(listing.school || ""),
    campus: String(listing.campus || ""),
    ownerId: String(listing.sellerId || ""),
  };
}

const Y = "#FAC515";
const DARK = "#151515";
const GRAY = "#818181";
const BG = "#F5F5F5";
const ERROR = "#9B7C2E";

const homeSearchSuggestions = [
  "IKEA desk",
  "Stanley cup",
  "MacBook Pro",
  "Calculus textbook",
  "Study lamp",
  "Office chair",
  "Mini fridge",
  "Bike lock",
];

const products: Product[] = [
  {
    id: 1,
    title: "Vivienne Westwood Wallet",
    price: 230,
    cardHeight: 168,
    seller: "Izzy F.",
    sellerAvatar:
      "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=120&h=120&fit=crop",
    sellerRating: 4.8,
    location: "USC University Park",
    posted: "2h ago",
    condition: "Used",
    category: "Clothing",
    description:
      "Barely used burgundy croc-embossed wallet. Minor wear on the corners and otherwise in great condition.",
    images: [
      "https://images.unsplash.com/photo-1627123424574-724758594e93?w=900&h=1100&fit=crop",
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=900&h=1100&fit=crop",
      "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=900&h=1100&fit=crop",
    ],
  },
  {
    id: 2,
    title: "Pride and Prejudice",
    price: 10,
    cardHeight: 222,
    seller: "Tina S.",
    sellerAvatar:
      "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=120&h=120&fit=crop",
    sellerRating: 4.9,
    location: "USC Village",
    posted: "5h ago",
    condition: "Good",
    category: "Books",
    description:
      "Penguin Classics edition with a few pencil notes. Perfect for class or weekend reading.",
    images: [
      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=900&h=1200&fit=crop",
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=900&h=1200&fit=crop",
      "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=900&h=1200&fit=crop",
    ],
  },
  {
    id: 3,
    title: "Stanley Tumbler 40oz",
    price: 35,
    cardHeight: 242,
    seller: "Mia L.",
    sellerAvatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&h=120&fit=crop",
    sellerRating: 5.0,
    location: "UCLA Westwood",
    posted: "1d ago",
    condition: "Like New",
    category: "Other",
    description:
      "Limited edition pink tumbler, used twice. No scratches and comes with the original box.",
    images: [
      "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=900&h=1200&fit=crop",
      "https://images.unsplash.com/photo-1523362628745-0c100150b504?w=900&h=1200&fit=crop",
    ],
  },
  {
    id: 4,
    title: "MacBook Pro 14-inch M2",
    price: 1100,
    cardHeight: 174,
    seller: "Kwame O.",
    sellerAvatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop",
    sellerRating: 4.7,
    location: "NYU Washington Square",
    posted: "3h ago",
    condition: "Great",
    category: "Electronics",
    description:
      "M2 Pro, 16GB RAM and 512GB SSD. Space Gray with AppleCare. No dents or scratches.",
    images: [
      "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=1000&h=800&fit=crop",
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1000&h=800&fit=crop",
      "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=1000&h=800&fit=crop",
    ],
  },
  {
    id: 5,
    title: "IKEA White Desk",
    price: 50,
    cardHeight: 208,
    seller: "Jordan K.",
    sellerAvatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop",
    sellerRating: 4.6,
    location: "USC University Park",
    posted: "2d ago",
    condition: "Good",
    category: "Furniture & Home",
    description:
      "White desk, 47 × 23 inches. One small scuff on a leg. Campus pickup only.",
    images: [
      "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=1000&h=1000&fit=crop",
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1000&h=1000&fit=crop",
    ],
  },
  {
    id: 6,
    title: "Calculus: Early Transcendentals",
    price: 28,
    cardHeight: 236,
    seller: "Daniel W.",
    sellerAvatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&h=120&fit=crop",
    sellerRating: 4.9,
    location: "UC Berkeley",
    posted: "6h ago",
    condition: "Good",
    category: "School Supplies",
    description:
      "Stewart Calculus 9th edition. Highlighted chapters 1–8 with no missing pages.",
    images: [
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=900&h=1200&fit=crop",
      "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=900&h=1200&fit=crop",
    ],
  },
];

const categories = [
  "All",
  "Electronics",
  "School Supplies",
  "Furniture & Home",
  "Clothing",
  "Books",
  "Other",
];
const recentSearches = [
  "Sofa",
  "Lamp",
  "Backpack",
  "Monitor",
  "AirPods",
  "Textbook",
];
const quickSearches = [
  "MacBook",
  "Dining table",
  "Running shoes",
  "Textbooks",
  "Mini fridge",
  "Desk chair",
];
const dms: DM[] = [
  {
    id: 1,
    name: "Izzy F.",
    avatar: products[0].sellerAvatar,
    productId: 1,
    last: "Yes, I can meet after class!",
    time: "2m",
    unread: 1,
    online: true,
  },
  {
    id: 2,
    name: "Jordan K.",
    avatar: products[4].sellerAvatar,
    productId: 5,
    last: "Can you pick up at USC Village?",
    time: "14m",
    unread: 0,
    online: false,
  },
  {
    id: 3,
    name: "Kwame O.",
    avatar: products[3].sellerAvatar,
    productId: 4,
    last: "The battery health is 96%.",
    time: "1h",
    unread: 2,
    online: true,
  },
  {
    id: 4,
    name: "Tina S.",
    avatar: products[1].sellerAvatar,
    productId: 2,
    last: "I left the notes in pencil 📚",
    time: "3h",
    unread: 0,
    online: false,
  },
];

const startingChats: Record<string | number, ChatMessage[]> = {
  1: [
    {
      from: "them",
      text: "Hi! The wallet is still available.",
      time: "2:10 PM",
    },
    { from: "me", text: "Would you take $215?", time: "2:12 PM", read: true },
    { from: "them", text: "Yes, I can meet after class!", time: "2:14 PM" },
  ],
  2: [
    {
      from: "me",
      text: "Is the desk easy to disassemble?",
      time: "1:02 PM",
      read: true,
    },
    {
      from: "them",
      text: "Yes! The legs come off. Can you pick up at USC Village?",
      time: "1:05 PM",
    },
  ],
  3: [
    {
      from: "me",
      text: "How is the battery health?",
      time: "11:40 AM",
      read: true,
    },
    {
      from: "them",
      text: "The battery health is 96%. I can send a screenshot too.",
      time: "11:44 AM",
    },
  ],
  4: [
    {
      from: "them",
      text: "It has a few notes, but they are all in pencil 📚",
      time: "Yesterday",
    },
    { from: "me", text: "Perfect, thank you!", time: "Yesterday", read: true },
  ],
};

const fmt = (n: number) =>
  n >= 1000 ? `$${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : `$${n}`;
const checkoutTotals = (items: CartItem[]) => {
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.qty, 0);
  const tax = subtotal * 0.095;
  const protection = items.length ? Math.max(1.99, subtotal * 0.025) : 0;
  return { subtotal, tax, protection, total: subtotal + tax + protection };
};
const productForDm = (dm: DM) =>
  dm.product || products.find((p) => p.id === dm.productId) || products[0];
const dmForProduct = (p: Product): DM =>
  ({
    id: `listing-${p.id}`,
    recipientId: p.ownerId,
    name: p.seller,
    avatar: p.sellerAvatar,
    productId: p.id,
    product: p,
    last: "Ask about this item",
    time: "Now",
    unread: 0,
    online: false,
  });
const conversationToDm = (conversation: any): DM | null => {
  if (!conversation.recipient || !conversation.listing) return null;
  const product = listingToProduct(conversation.listing);
  const lastMessage = conversation.messages?.[conversation.messages.length - 1];
  return {
    id: String(conversation.id),
    recipientId: String(conversation.recipient.id),
    name: String(conversation.recipient.name),
    avatar: String(conversation.recipient.avatar || hiveLogoSmall),
    productId: product.id,
    product,
    last: String(lastMessage?.text || "No messages yet"),
    time: lastMessage?.createdAt ? new Date(lastMessage.createdAt).toLocaleDateString() : "",
    unread: Number(conversation.unread || 0),
    online: false,
  };
};

function StatusBar({ light = false }: { light?: boolean }) {
  const c = light ? "white" : DARK;
  return (
    <div className="flex items-center justify-between px-5 pt-4 pb-1 shrink-0">
      <span className="text-xs font-bold" style={{ color: c }}>
        9:41
      </span>
      <div className="flex items-center gap-2">
        <div className="flex gap-px items-end h-3">
          {[3, 5, 8, 10].map((h, i) => (
            <span
              key={i}
              className="w-[3px] rounded-sm"
              style={{ height: h, background: i < 3 ? c : `${c}44` }}
            />
          ))}
        </div>
        <span
          className="w-[22px] h-[11px] rounded-[3px] border p-[1px] flex"
          style={{ borderColor: c }}
        >
          <span className="w-3/4 rounded-sm" style={{ background: c }} />
        </span>
      </div>
    </div>
  );
}

function AuthScreen({
  mode,
  onMode,
  onEnter,
  onLegal,
}: {
  mode: AuthMode;
  onMode: (m: AuthMode) => void;
  onEnter: (user?: { email?: string; profile?: UserInfo }) => void;
  onLegal: (title: "Terms of Service" | "Privacy Policy") => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [note, setNote] = useState("");
  const [agreed, setAgreed] = useState(false);
  const resetToken = new URLSearchParams(location.hash.replace(/^#/, "")).get("reset") || "";
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setEmailError("");
    setPasswordError("");
    setNote("");
    if (mode === "verify") {
      try {
        const data = await api("/api/auth/verify", "POST", { email, code });
        onEnter(data.user);
      } catch (error) { setNote((error as Error).message); }
      return;
    }
    if (mode === "reset") {
      if (!resetToken) { setNote("This reset link is incomplete. Request a new one."); return; }
      if (password.length < 8) { setPasswordError("Use a password with at least 8 characters."); return; }
      try { const data = await api("/api/auth/password-reset/confirm", "POST", { token: resetToken, password }); setNote(data.message); history.replaceState(null, "", location.pathname); window.setTimeout(() => onMode("login"), 900); }
      catch (error) { setNote((error as Error).message); }
      return;
    }
    if (!email.trim()) {
      setEmailError("Please enter your school email address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.edu$/i.test(email.trim())) {
      setEmailError("Please log in with your school .edu email.");
      return;
    }
    if (mode === "forgot") {
      try { const data = await api("/api/auth/password-reset/request", "POST", { email }); setNote(data.message); }
      catch (error) { setNote((error as Error).message); }
      return;
    }
    if (password.length < 6) {
      setPasswordError("Please enter password.");
      return;
    }
    if (mode === "signup") {
      if (!agreed) { setNote("Please agree to the Terms of Service and Privacy Policy to create an account."); return; }
      try {
        const data = await api("/api/auth/signup", "POST", { email, password });
        setNote(data.message);
        onMode("verify");
      } catch (error) { setNote((error as Error).message); }
      return;
    }
    try {
      const data = await api("/api/auth/login", "POST", { email, password });
      onEnter(data.user);
    } catch (error) {
      const details = (error as Error & { data?: { needsVerification?: boolean } }).data;
      if (details?.needsVerification) onMode("verify");
      else setNote((error as Error).message);
    }
  };
  const title =
    mode === "login"
      ? "Welcome Back"
      : mode === "signup"
        ? "Create Account"
        : mode === "verify"
          ? "Verify Your Email"
          : mode === "reset" ? "Choose a New Password" : "Reset Password";
  const subtitle =
    mode === "login"
      ? "Log in to continue hiving"
      : mode === "signup"
        ? "Join your verified campus community"
        : mode === "verify"
          ? "Enter the code sent to your school email"
          : mode === "reset" ? "Create a new password for your Hive account" : "We'll send a secure reset link";
  return (
    <div className="auth-screen auth-page screen-in h-full overflow-y-auto bg-[#F6F6F6] px-6 pb-8">
      <StatusBar />
      <div className="min-h-[760px] flex flex-col justify-center max-w-sm mx-auto py-5">
        <header className="text-center mb-8">
          <img
            src={hiveLogo}
            alt="Hive"
            className="w-[68px] h-[71px] object-contain mx-auto mb-7"
          />
          <h1 className="text-[30px] leading-tight font-bold tracking-[-.7px]">
            {title}
          </h1>
          <p className="text-[15px] mt-2">{subtitle}</p>
        </header>
        <form
          onSubmit={submit}
          className="auth-card bg-white px-7 py-8"
        >
          {mode !== "verify" && mode !== "reset" && (
            <label className="block mb-4">
              <span className="text-[15px] font-medium">Email Address</span>
              <div className="input-shell mt-2 h-[61px] rounded-[10px] bg-[#F3F3F3] flex items-center px-5 gap-3">
                <Mail size={17} color={GRAY} />
                <input
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError("");
                  }}
                  className="input-core flex-1 bg-transparent text-[11px] one-line"
                  placeholder="Log in with your school .edu email"
                  type="email"
                />
              </div>
              {emailError && (
                <p className="field-hint auth-hint">{emailError}</p>
              )}
            </label>
          )}
          {(mode === "login" || mode === "signup" || mode === "reset") && (
            <label className="block">
              <span className="text-[15px] font-medium">Password</span>
              <div className="input-shell mt-2 h-[61px] rounded-[10px] bg-[#F3F3F3] flex items-center px-5 gap-3">
                <LockKeyhole size={17} color={GRAY} />
                <input
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError("");
                  }}
                  className="input-core flex-1 bg-transparent text-[11px] one-line"
                  placeholder="At least 8 characters"
                  type={showPassword ? "text" : "password"}
                />
                <button
                  type="button"
                  aria-label="Show or hide password"
                  onClick={() => setShowPassword((v) => !v)}
                  className="eye-button p-2 rounded-lg"
                >
                  <Eye size={19} />
                </button>
              </div>
              {passwordError && (
                <p className="field-hint auth-hint">{passwordError}</p>
              )}
            </label>
          )}
          {mode === "verify" && (
            <label className="block">
              <span className="text-[15px] font-medium">Verification Code</span>
              <div className="input-shell mt-2 rounded-[10px] bg-[#F3F3F3]">
                <input
                  autoFocus
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                    setNote("");
                  }}
                  className="input-core h-[61px] w-full bg-transparent text-center text-xl tracking-[.3em]"
                  placeholder="Enter Code"
                  inputMode="numeric"
                />
              </div>
            </label>
          )}
          {mode === "login" && (
            <button
              type="button"
              onClick={() => onMode("forgot")}
              className="block ml-auto text-[14px] mt-3 hover:underline"
            >
              Forgot Password?
            </button>
          )}
          {note && <p className="field-hint text-center">{note}</p>}
          {mode === "signup" && <div className="auth-legal-copy"><b>Privacy &amp; Safety</b><p>Hive is a verified student community. Your data is protected, and you stay in control of your information.</p><label className="auth-agree"><input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} /><span>I agree to the <button type="button" onClick={() => onLegal("Terms of Service")}>Terms of Service</button> &amp; <button type="button" onClick={() => onLegal("Privacy Policy")}>Privacy Policy</button></span></label></div>}
          <button
            type="submit"
            className="pressable mt-5 w-full h-[60px] rounded-[10px] text-[15px] font-medium"
            style={{ background: "#FFD24A" }}
          >
            {mode === "login"
              ? "Log In"
              : mode === "signup"
                ? "Sign Up"
                : mode === "verify"
                  ? "Verify Code"
                  : mode === "reset" ? "Save New Password" : "Send Reset Link"}
          </button>
          {mode === "verify" && (
            <button
              type="button"
              onClick={async () => {
                try { const data = await api("/api/auth/resend", "POST", { email }); setNote(data.message); }
                catch (error) { setNote((error as Error).message); }
              }}
              className="w-full mt-4 text-sm hover:underline"
            >
              Not seeing the code? Try Again
            </button>
          )}
        </form>
        <p className="text-center text-sm mt-4">
          {mode === "login" ? (
            <>
              Don't have an account?{" "}
              <button
                className="font-bold hover:underline"
                onClick={() => onMode("signup")}
              >
                Sign Up
              </button>
            </>
          ) : mode === "signup" ? (
            <>
              Already have an account?{" "}
              <button
                className="font-bold hover:underline"
                onClick={() => onMode("login")}
              >
                Log In
              </button>
            </>
          ) : (
            <button
              className="font-bold hover:underline"
              onClick={() => onMode("login")}
            >
              Back to login
            </button>
          )}
        </p>
      </div>
    </div>
  );
}

function TermsOfServiceContent() {
  const sections: Array<{ heading: string; paragraphs?: string[]; intro?: string; bullets?: string[] }> = [
    {
      heading: "Hive Terms of Service",
      paragraphs: [
        "Welcome to Hive (“Hive,” “we,” “our,” or “us”). Hive is a student-focused peer-to-peer marketplace that enables verified students to buy, sell, and discover secondhand goods within their campus communities.",
        "Hive also provides AI-powered tools that assist users by analyzing listings, suggesting pricing, categorizing products, identifying missing information, and improving marketplace safety.",
        "By creating an account or using Hive, you agree to these Terms of Service (“Terms”). If you do not agree, please do not use the platform.",
      ],
    },
    {
      heading: "1. Eligibility",
      intro: "To use Hive, you must:",
      bullets: [
        "Be at least 18 years old (or the age of majority in your jurisdiction).",
        "Register using a valid university email or another verification method approved by Hive.",
        "Provide accurate and truthful account information.",
        "Comply with all applicable laws and these Terms.",
        "You are responsible for maintaining the security of your account and any activities conducted through it.",
      ],
    },
    {
      heading: "2. License to Use Hive",
      paragraphs: [
        "Hive grants you a limited, non-exclusive, non-transferable, revocable license to access and use Hive solely for personal, non-commercial purposes.",
        "This license does not transfer ownership of Hive, our software, AI models, branding, or intellectual property.",
      ],
      intro: "You may not:",
      bullets: [
        "Copy or redistribute Hive’s software.",
        "Reverse engineer or attempt to extract source code.",
        "Use automated bots without authorization.",
        "Resell or commercially exploit Hive without written permission.",
      ],
    },
    {
      heading: "3. AI Marketplace Assistant",
      paragraphs: [
        "Hive uses artificial intelligence to improve marketplace listings. The AI may estimate market prices, suggest product categories, recommend listing titles and descriptions, detect duplicate or prohibited listings, flag potentially fraudulent or misleading content, and suggest improvements to listing quality.",
        "AI-generated recommendations are provided for informational purposes only. Hive does not guarantee that AI pricing estimates, authenticity assessments, or recommendations are accurate or complete.",
      ],
      intro: "Users remain solely responsible for:",
      bullets: ["Setting final prices.", "Verifying product information.", "Completing transactions.", "Ensuring listings comply with applicable laws."],
    },
    {
      heading: "4. User Content",
      paragraphs: [
        "You retain ownership of all content you submit, including photos, product descriptions, messages, reviews, and profile information.",
        "By posting content on Hive, you grant Hive a worldwide, non-exclusive, royalty-free license to host, store, display, reproduce, modify (for formatting only), and distribute your content as necessary to operate the Marketplace.",
        "This license ends when your content is removed, except where copies must be retained for legal, security, fraud prevention, or backup purposes.",
      ],
    },
    {
      heading: "5. Marketplace Rules",
      intro: "Users agree that listings must:",
      bullets: [
        "Accurately represent the item being sold.",
        "Include truthful descriptions.",
        "Use original photos or photos you have permission to use.",
        "Clearly disclose defects or damage.",
        "Comply with applicable laws and university policies.",
        "Hive reserves the right to remove listings that violate these Terms.",
      ],
    },
    {
      heading: "6. Prohibited Conduct",
      intro: "You may not:",
      bullets: [
        "Sell illegal or prohibited items.", "Post fraudulent or misleading listings.", "Impersonate another person.", "Circumvent verification systems.", "Manipulate AI recommendations.", "Attempt to hack or interfere with Hive systems.", "Harass, threaten, or abuse other users.", "Upload malware or harmful software.", "Collect other users’ information without permission.", "Use Hive for unauthorized commercial advertising or spam.", "Violation of these rules may result in suspension or permanent removal.",
      ],
    },
    {
      heading: "7. Transactions Between Users",
      paragraphs: ["Hive provides a platform that connects buyers and sellers. Hive is not the seller of listed products and is not responsible for delivery or product quality."],
      intro: "Buyers and sellers are solely responsible for:",
      bullets: ["Communicating honestly.", "Meeting safely.", "Inspecting products before purchase.", "Completing payment arrangements.", "Resolving disputes directly whenever possible."],
    },
    {
      heading: "8. AI Moderation",
      paragraphs: ["Hive may use automated systems to detect fraudulent listings, scam behavior, counterfeit products, suspicious pricing, duplicate listings, and inappropriate content.", "Automated decisions may occasionally be incorrect. Hive reserves the right to review, remove, or request additional information regarding any listing."],
    },
    {
      heading: "9. Safety",
      intro: "Users should always:",
      bullets: ["Meet in public, well-lit locations.", "Follow campus safety recommendations.", "Never share sensitive financial or personal information unnecessarily.", "Report suspicious behavior.", "Hive cannot guarantee the behavior or identity of every user."],
    },
    {
      heading: "10. Intellectual Property",
      paragraphs: ["All Hive software, logos, branding, AI systems, interface designs, and marketplace technology remain the exclusive property of Hive.", "You may not use Hive branding without prior written permission."],
    },
    {
      heading: "11. Account Suspension & Termination",
      intro: "Hive may suspend or terminate your account if you:",
      bullets: ["Violate these Terms.", "Engage in fraud.", "Misuse AI tools.", "Harass other users.", "Post prohibited content.", "Attempt to compromise platform security.", "Hive may remove listings without prior notice when necessary to protect users or comply with legal obligations. You may also delete your account at any time."],
    },
    {
      heading: "12. Disclaimer of Warranties",
      paragraphs: ["Hive is provided “AS IS” and “AS AVAILABLE.”", "To the fullest extent permitted by law, Hive makes no warranties regarding AI-generated recommendations, listing accuracy, product authenticity, availability of services, marketplace uptime, successful transactions, or user conduct.", "We do not guarantee uninterrupted, secure, or error-free operation."],
    },
    {
      heading: "13. Limitation of Liability",
      paragraphs: ["To the fullest extent permitted by law, Hive, its founders, employees, affiliates, and partners shall not be liable for financial losses, lost profits, lost opportunities, property damage, personal injury, data loss, marketplace disputes, AI errors or inaccurate recommendations, or actions of buyers or sellers.", "Your use of Hive is at your own risk."],
    },
    {
      heading: "14. Changes to These Terms",
      paragraphs: ["Hive may update these Terms periodically. If material changes are made, users will be notified through the app or by email.", "Continued use of Hive after changes become effective constitutes acceptance of the revised Terms."],
    },
    {
      heading: "15. Contact",
      paragraphs: ["If you have questions about these Terms, please contact Hive Marketplace.", "Email: support@hivemarketplace.com (placeholder)", "Website: www.hivemarketplace.com (placeholder)"],
    },
    {
      heading: "AI Transparency",
      paragraphs: ["Hive uses artificial intelligence to assist users with marketplace activities, including pricing suggestions, category recommendations, fraud detection, listing optimization, and search personalization.", "AI outputs are generated using algorithms trained on marketplace data and are intended to assist—not replace—user judgment. Hive does not guarantee the accuracy, completeness, or suitability of AI-generated recommendations, and users remain responsible for verifying all information before making purchasing or selling decisions."],
    },
  ];
  return <div className="legal-page space-y-4">{sections.map((section) => <section key={section.heading} className="legal-card"><h2>{section.heading}</h2>{section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}{section.intro && <p>{section.intro}</p>}{section.bullets && <ul>{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>}</section>)}</div>;
}

function PrivacyPolicyContent() {
  const sections: Array<{ heading: string; paragraphs?: string[]; intro?: string; bullets?: string[] }> = [
    { heading: "Your trust is our priority.", paragraphs: ["Hive is built exclusively for verified student communities. We take privacy, safety, and transparency seriously so you can connect, buy, sell, and discover opportunities with confidence."] },
    { heading: "Your Privacy", bullets: ["Your personal information is securely stored and protected.", "We only collect the information necessary to provide Hive's services.", "Your data is never sold to third parties.", "You control what information appears on your public profile.", "You can update or delete your account at any time."] },
    { heading: "Verified Community", bullets: ["Users are verified through a university email or another approved verification method.", "Verified accounts help create a safer and more trusted campus community.", "Fake accounts, impersonation, and fraudulent activity are not tolerated."] },
    { heading: "AI Transparency", paragraphs: ["Hive uses AI to help improve marketplace listings by suggesting categories, pricing, titles, and descriptions, and by helping identify potentially misleading or duplicate listings.", "AI recommendations are provided to assist you—they are not guarantees. You are responsible for reviewing all information before posting or making a purchase."] },
    { heading: "Marketplace Safety", intro: "When meeting another user:", bullets: ["Meet in a public, well-lit location.", "Inspect items before completing payment.", "Never share passwords, verification codes, or sensitive financial information.", "Report suspicious users or listings directly through the app."] },
    { heading: "Community Standards", intro: "To keep Hive safe for everyone, users may not:", bullets: ["Post fraudulent or misleading listings.", "Harass or threaten other users.", "Sell illegal or prohibited items.", "Attempt to bypass verification or misuse Hive's AI features.", "Violations may result in listing removal or account suspension."] },
    { heading: "By continuing, you agree to:", bullets: ["Hive's Terms of Service and Privacy Policy.", "Hive is a peer-to-peer platform, and you are responsible for verifying listings and using safe judgment during transactions."] },
  ];
  return <div className="legal-page space-y-4">{sections.map((section) => <section key={section.heading} className="legal-card"><h2>{section.heading}</h2>{section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}{section.intro && <p>{section.intro}</p>}{section.bullets && <ul>{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>}</section>)}</div>;
}

function AuthLegalPage({ title, onBack }: { title: "Terms of Service" | "Privacy Policy"; onBack: () => void }) {
  const terms = title === "Terms of Service";
  return (
    <div className="screen-in h-full overflow-y-auto bg-white px-6 pb-8">
      <StatusBar />
      <div className="max-w-sm mx-auto pt-7">
        <button onClick={onBack} className="flex items-center gap-2 text-sm font-bold mb-6"><ArrowLeft size={19} /> Back</button>
        <img src={hiveLogo} alt="Hive" className="w-12 h-12 object-contain mb-6" />
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-sm text-gray-500 mt-2">Last updated: July 2026</p>
        <div className="mt-7">
          {terms ? <TermsOfServiceContent /> : <PrivacyPolicyContent />}
        </div>
      </div>
    </div>
  );
}

function BottomNav({
  active,
  onSelect,
  cartCount,
  messageCount,
}: {
  active: Tab;
  onSelect: (t: Tab) => void;
  cartCount: number;
  messageCount: number;
}) {
  const tabs = [
    { id: "home" as Tab, Icon: Home, label: "Hive" },
    { id: "cart" as Tab, Icon: ShoppingCart, label: "Cart" },
    { id: "post" as Tab, Icon: Plus, label: "" },
    { id: "messages" as Tab, Icon: MessageCircle, label: "Messages" },
    { id: "profile" as Tab, Icon: User, label: "Profile" },
  ];
  return (
    <nav className="glass-nav hive-bottom-nav absolute bottom-3 left-3 right-3 h-[72px] rounded-[38px] flex items-center justify-around px-2 z-30">
      {tabs.map(({ id, Icon, label }) => {
        const selected = active === id;
        if (id === "post")
          return (
            <button
              key={id}
              aria-label="Sell an item"
              onClick={() => onSelect(id)}
            className="nav-circle hive-post-nav"
            >
              <Plus size={29} />
            </button>
          );
        return (
          <button
            key={id}
            aria-label={label}
            onClick={() => onSelect(id)}
            className={selected ? "nav-active hive-nav-active" : "nav-circle hive-nav-circle"}
          >
            <span className="relative">
              <Icon size={24} strokeWidth={selected ? 2.5 : 1.8} />
              {id === "cart" && cartCount > 0 && (
                <b className="badge">{cartCount}</b>
              )}
              {id === "messages" && messageCount > 0 && (
                <b className="badge">{messageCount > 99 ? "99+" : messageCount}</b>
              )}
            </span>
            {selected && (
              <span className="text-[15px] font-medium">{label}</span>
            )}
          </button>
        );
      })}
    </nav>
  );
}

function HomeScreen({
  user,
  items,
  savedIds,
  onToggleSaved,
  onSearch,
  onProduct,
}: {
  user: UserInfo;
  items: Product[];
  savedIds: string[];
  onToggleSaved: (listingId: string) => void;
  onSearch: () => void;
  onProduct: (p: Product) => void;
}) {
  const [category, setCategory] = useState("All");
  const [scope, setScope] = useState(user.campus || user.school);
  const [scopeMode, setScopeMode] = useState<"my" | "nearby" | "nationwide" | "custom">("my");
  const [scopeOpen, setScopeOpen] = useState(false);
  const [custom, setCustom] = useState("");
  const [searchSuggestion, setSearchSuggestion] = useState(
    () => homeSearchSuggestions[Math.floor(Math.random() * homeSearchSuggestions.length)],
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      setSearchSuggestion((current) => {
        const alternatives = homeSearchSuggestions.filter((suggestion) => suggestion !== current);
        return alternatives[Math.floor(Math.random() * alternatives.length)];
      });
    }, 2600);

    return () => window.clearInterval(interval);
  }, []);

  const schoolKey = (value: string) => {
    const raw = value.toLowerCase().replace(/[^a-z0-9]/g, "");
    const aliases: Record<string, string> = {
      universityofcaliforniasantabarbara: "ucsb",
      ucsantabarbara: "ucsb",
      universityofsoutherncalifornia: "usc",
      universityofcalifornialosangeles: "ucla",
      universityofcaliforniasandiego: "ucsd",
      universityofcaliforniairvine: "uci",
      newyorkuniversity: "nyu",
    };
    return aliases[raw] || raw;
  };
  const mySchool = schoolKey(user.school);
  const nearbySchools: Record<string, string[]> = {
    ucsb: ["ucsb", "usc", "ucla", "uci", "calpolyslo", "csun", "csulb"],
    usc: ["usc", "ucla", "uci", "ucsb", "csun", "csulb"],
    ucla: ["ucla", "usc", "uci", "ucsb", "csun", "csulb"],
    uci: ["uci", "usc", "ucla", "ucsb", "csulb"],
  };
  const matchesScope = (item: Product) => {
    const itemSchool = schoolKey(item.school || item.location);
    if (scopeMode === "nationwide") return true;
    if (scopeMode === "my") return itemSchool === mySchool;
    if (scopeMode === "nearby") return (nearbySchools[mySchool] || [mySchool]).includes(itemSchool);
    const target = schoolKey(scope);
    return Boolean(target) && (itemSchool.includes(target) || target.includes(itemSchool));
  };
  const filtered = items.filter((p) => matchesScope(p) && (category === "All" || p.category === category));
  const applyCustomScope = () => {
    const next = custom.trim();
    if (!next) return;
    setScope(next);
    setScopeMode("custom");
    setScopeOpen(false);
  };
  const isSaved = (id: string | number) => savedIds.includes(String(id));
  const card = (p: Product) => (
    <article
      key={p.id}
      onClick={() => onProduct(p)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onProduct(p);
      }}
      tabIndex={0}
      role="button"
      className="product-card mb-3 bg-white rounded-[16px] overflow-hidden shadow-sm cursor-pointer"
    >
      <img
        src={p.images[0]}
        alt={p.title}
        className="w-full object-cover"
        style={{ height: p.cardHeight }}
      />
      <div className="p-3 pb-2">
        <p className="text-[13px] font-semibold leading-snug line-clamp-1">
          {p.title}
        </p>
        <div className="flex items-end justify-between mt-2">
          <div className="min-w-0">
            <p className="text-[17px] font-bold" style={{ color: "#F29A00" }}>
              {fmt(p.price)}
            </p>
            <p className="text-[10px] text-gray-400 mt-1 line-clamp-1">
              {p.location}
            </p>
          </div>
          <button
            aria-label="Save item"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSaved(String(p.id));
            }}
            className={`save-star ${isSaved(p.id) ? "saved" : ""}`}
          >
            <Star size={18} />
          </button>
        </div>
      </div>
    </article>
  );
  return (
    <div className="h-full flex flex-col bg-[#F5F5F5] home-screen home-chrome">
      <header className="bg-white shrink-0 home-header home-header-liquid">
        <StatusBar />
        <div className="px-5 pt-2 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={user.avatar || hiveLogoSmall}
              onError={(event) => { event.currentTarget.src = hiveLogoSmall; }}
              className="w-12 h-12 rounded-full object-cover"
              alt={user.name}
            />
            <div>
              <h1 className="text-[22px] leading-none font-bold tracking-[-.35px]">
                Hi {user.name}
              </h1>
              <p className="text-[11px] mt-1 text-stone-700">
                {user.school} '{user.grad}
              </p>
            </div>
          </div>
          <div className="relative max-w-[170px]">
            <button
              onClick={() => setScopeOpen((v) => !v)}
              className="flex items-center text-[11px] font-medium text-right gap-1 rounded-xl px-2 py-2 hover:bg-gray-50"
            >
              <span className="line-clamp-2">{scope}</span>
              <ChevronDown size={14} />
            </button>
            {scopeOpen && (
              <div className="absolute right-0 top-12 z-40 w-60 rounded-2xl bg-white border border-gray-100 shadow-xl p-2">
                <button
                  onClick={() => {
                    setScope(user.campus || user.school);
                    setScopeMode("my");
                    setScopeOpen(false);
                  }}
                  className="location-option"
                >
                  <MapPin size={15} />
                  My campus
                </button>
                <button
                  onClick={() => {
                    setScope("Nearby campuses");
                    setScopeMode("nearby");
                    setScopeOpen(false);
                  }}
                  className="location-option"
                >
                  <MapPin size={15} />
                  Nearby campuses
                </button>
                <button
                  onClick={() => {
                    setScope("Universities nationwide");
                    setScopeMode("nationwide");
                    setScopeOpen(false);
                  }}
                  className="location-option"
                >
                  <Globe2 size={15} />
                  Universities nationwide
                </button>
                <div className="border-t mt-1 pt-2">
                  <p className="text-[11px] text-gray-400 px-2 mb-1">
                    Enter another university
                  </p>
                  <div className="input-shell flex items-center rounded-xl bg-gray-100 px-3">
                    <input
                      value={custom}
                      onChange={(e) => setCustom(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") applyCustomScope();
                      }}
                      className="input-core h-10 flex-1 bg-transparent text-xs"
                      placeholder="e.g. UCLA"
                    />
                    <button aria-label="Search this university" onClick={applyCustomScope}>
                      <Search size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="px-4 pb-3">
          <button
            onClick={onSearch}
            className="search-shell home-search w-full flex items-center gap-3 px-4 h-12 rounded-2xl bg-white border border-gray-300"
          >
            <Search size={17} color={GRAY} />
            <span className="flex-1 text-left text-[11px] text-gray-400 one-line">
              {searchSuggestion}
            </span>
            <Mic size={17} color={GRAY} />
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 pb-3">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`home-category shrink-0 px-4 py-2 rounded-full border text-[11px] font-medium ${category === c ? "selected" : ""}`}
              style={{
                background: category === c ? Y : "white",
                borderColor: category === c ? Y : "#E7E7E7",
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </header>
      <main className="flex-1 overflow-y-auto scrollbar-hide px-3 pt-3 pb-5">
        {filtered.length ? (
          <div className="grid grid-cols-2 gap-3 items-start">
            <div>{filtered.filter((_, i) => i % 2 === 0).map(card)}</div>
            <div className="pt-7">
              {filtered.filter((_, i) => i % 2 === 1).map(card)}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-white px-5 py-10 text-center text-sm text-gray-500">
            No listings match this campus yet.
          </div>
        )}
      </main>
    </div>
  );
}

function SearchScreen({
  onBack,
  onProduct,
  items,
}: {
  onBack: () => void;
  onProduct: (p: Product) => void;
  items: Product[];
}) {
  const [q, setQ] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    input.current?.focus();
    void api("/api/search-history")
      .then((data) => setRecent(data.queries || []))
      .catch(() => {});
  }, []);
  const needle = q.trim().toLowerCase();
  const matches = needle.length > 1
    ? items.filter((p) => `${p.title} ${p.category} ${p.location} ${p.description}`.toLowerCase().includes(needle))
    : [];
  const recordSearch = async (query: string) => {
    const clean = query.trim();
    if (clean.length < 2) return;
    try {
      const data = await api("/api/search-history", "POST", { query: clean });
      setRecent(data.queries || []);
    } catch { /* A search can still show results if storage is unavailable. */ }
  };
  return (
    <div className="h-full flex flex-col bg-white">
      <StatusBar />
      <div className="px-4 py-2 flex gap-3 items-center">
        <button onClick={onBack} className="icon-button p-2 rounded-full">
          <ArrowLeft size={20} />
        </button>
        <div className="input-shell h-12 flex-1 rounded-2xl bg-gray-100 px-4 flex items-center gap-2">
          <Search size={16} />
          <input
            ref={input}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void recordSearch(q);
            }}
            className="input-core flex-1 bg-transparent text-[11px] one-line"
            placeholder="Search universities, items..."
          />
          <Mic size={17} />
          {q && (
            <button onClick={() => setQ("")}>
              <X size={15} />
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {q.length < 2 ? (
          <>
            <section>
              <h2 className="text-sm font-bold mb-3">Recent Search</h2>
              <div className="flex flex-wrap gap-2">
                {recent.map((x) => (
                  <button
                    key={x}
                    onClick={() => { setQ(x); void recordSearch(x); }}
                    className="px-4 py-2 rounded-full bg-gray-100 text-xs"
                  >
                    {x}
                  </button>
                ))}
              </div>
            </section>
            {!recent.length && <p className="text-xs text-gray-400">Your searches will appear here.</p>}
          </>
        ) : matches.length ? (
          <div className="space-y-3">
            <p className="text-[10px] text-gray-400">Results for “{q}”</p>
            {matches.map((p) => (
              <button
                key={p.id}
                onClick={() => { void recordSearch(q); onProduct(p); }}
                className="pressable w-full flex gap-3 p-3 rounded-2xl border border-gray-100 text-left"
              >
                <img
                  src={p.images[0]}
                  className="w-16 h-16 object-cover rounded-xl"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold line-clamp-1">
                    {p.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                    {p.location}
                  </p>
                  <p className="font-bold mt-1" style={{ color: "#F29A00" }}>
                    {fmt(p.price)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center text-sm text-gray-400 mt-24">
            <Package className="mx-auto mb-3" />
            No results for “{q}”
          </div>
        )}
      </div>
    </div>
  );
}

function ProductDetail({
  product,
  cart,
  onBack,
  onCart,
  onSave,
  onMessage,
  onSeller,
  onAdd,
  onBuy,
}: {
  product: Product;
  cart: CartItem[];
  onBack: () => void;
  onCart: () => void;
  onSave: () => void;
  onMessage: () => void;
  onSeller: () => void;
  onAdd: () => void;
  onBuy: () => void;
}) {
  const [slide, setSlide] = useState(0);
  const [saved, setSaved] = useState(false);
  const [notice, setNotice] = useState("");
  const touch = useRef(0);
  const count = product.images.length;
  const move = (d: number) => setSlide((v) => (v + d + count) % count);
  // Reviews will appear here once the marketplace has verified completed trades.
  const itemReviews: Array<{ name: string; avatar: string; text: string; date: string }> = [];
  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex-1 overflow-y-auto scrollbar-hide pb-24">
        <div
          className="relative h-[430px] bg-gray-100 overflow-hidden"
          onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            const d = e.changedTouches[0].clientX - touch.current;
            if (Math.abs(d) > 40) move(d < 0 ? 1 : -1);
          }}
        >
          <img
            src={product.images[slide]}
            alt={`${product.title} ${slide + 1}`}
            className="w-full h-full object-cover transition-opacity"
          />
          <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/35 to-transparent">
            <StatusBar light />
            <div className="px-4 pt-1 flex justify-between">
              <button onClick={onBack} className="floating-icon">
                <ChevronLeft size={26} />
              </button>
              <button onClick={onCart} className="floating-icon relative">
                <ShoppingCart size={23} />
                {cart.length > 0 && <b className="badge">{cart.length}</b>}
              </button>
            </div>
          </div>
          {count > 1 && (
            <>
              <button
                onClick={() => move(-1)}
                className="carousel-arrow left-3"
              >
                <ChevronLeft />
              </button>
              <button
                onClick={() => move(1)}
                className="carousel-arrow right-3"
              >
                <ChevronRight />
              </button>
            </>
          )}
          <span className="absolute bottom-4 right-4 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full">
            {slide + 1}/{count}
          </span>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {product.images.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlide(i)}
                className={`h-1.5 rounded-full ${i === slide ? "w-5 bg-white" : "w-1.5 bg-white/55"}`}
              />
            ))}
          </div>
        </div>
        <section className="px-5 py-5">
          <div className="flex justify-between gap-4">
            <div>
              <h1 className="text-[21px] font-bold leading-tight">
                {product.title}
              </h1>
              <p className="text-[13px] mt-1.5 text-gray-500">
                {product.location} · {product.posted}
              </p>
            </div>
            <p
              className="text-[24px] font-bold shrink-0"
              style={{ color: "#FF8A00" }}
            >
              {fmt(product.price)}
            </p>
          </div>
          <div className="flex gap-2 mt-4">
            <span className="tag-chip">{product.condition}</span>
            <span className="tag-chip">{product.category}</span>
          </div>
          <h2 className="text-sm font-bold mt-6 mb-2">Description</h2>
          <p className="text-sm leading-relaxed text-stone-700">
            {product.description}
          </p>
        </section>
        <section className="border-t border-gray-200 px-5 py-4">
          <div className="flex items-center gap-3">
            <img
              src={product.sellerAvatar}
              className="w-12 h-12 rounded-full object-cover"
            />
            <button onClick={onSeller} className="flex-1 text-left min-w-0">
              <p className="text-sm font-bold line-clamp-1">{product.seller}</p>
              <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                Verified student · ⭐ {product.sellerRating}
              </p>
            </button>
            <button
              onClick={onSeller}
              className="glass-button glass-accent px-4 h-9 text-[11px] font-semibold"
            >
              Profile
            </button>
          </div>
          <div className="flex items-center justify-between mt-5">
            <h2 className="text-sm font-bold">Reviews</h2>
            <span className="text-[10px] text-gray-400">
              {itemReviews.length} verified purchases
            </span>
          </div>
          <div className="mt-1">
            {itemReviews.map((review) => (
              <article key={review.name} className="review-row">
                <img
                  src={review.avatar}
                  alt={review.name}
                  className="w-9 h-9 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <b className="text-[11px] one-line">{review.name}</b>
                    <span className="text-[9px] text-gray-400 shrink-0">
                      {review.date}
                    </span>
                  </div>
                  <p className="text-[10px] mt-1" style={{ color: "#B48800" }}>
                    ★★★★★
                  </p>
                  <p className="text-[11px] text-gray-600 mt-1 leading-relaxed">
                    {review.text}
                  </p>
                </div>
              </article>
            ))}
            {!itemReviews.length && <p className="py-4 text-xs text-gray-400">No verified purchases yet.</p>}
          </div>
        </section>
      </div>
      {notice && (
        <div className="action-toast">
          <Check size={15} />
          {notice}
        </div>
      )}
      <div className="glass-actionbar absolute bottom-3 left-3 right-3 h-[70px] px-2.5 flex items-center gap-2 z-20">
        <button onClick={onMessage} className="detail-tool glass-icon-button">
          <MessageCircle size={20} />
          <span>Chat</span>
        </button>
        <button
          onClick={() => {
            setSaved((v) => !v);
            setNotice(
              saved ? "Removed from saved items" : "Saved to your profile",
            );
            onSave();
            setTimeout(() => setNotice(""), 1300);
          }}
          className={`detail-tool glass-icon-button ${saved ? "saved" : ""}`}
        >
          <Star
            size={20}
            className={saved ? "fill-[#FAC515] stroke-[#B98B00]" : ""}
          />
          <span>Save</span>
        </button>
        <div className="flex flex-1 h-11 gap-1.5 min-w-0">
          <button
            onClick={() => {
              onAdd();
              setNotice("Added to your cart");
              setTimeout(() => setNotice(""), 1300);
            }}
            className="glass-button glass-accent flex-1 text-[9px] font-semibold"
          >
            Add to cart
          </button>
          <button
            onClick={() => {
              setNotice("Opening secure checkout");
              setTimeout(onBuy, 320);
            }}
            className="glass-button glass-warm flex-1 text-[9px] font-semibold"
          >
            Purchase now
          </button>
        </div>
      </div>
    </div>
  );
}

function SellerProfile({
  product,
  onBack,
  onMessage,
  onProduct,
}: {
  product: Product;
  onBack: () => void;
  onMessage: () => void;
  onProduct: (product: Product) => void;
}) {
  const [follow, setFollow] = useState(false);
  const [notice, setNotice] = useState("");
  const [tab, setTab] = useState<"listings" | "reviews">("listings");
  const [actionsOpen, setActionsOpen] = useState(false);
  const [seller, setSeller] = useState<any>(null);
  const [profileItems, setProfileItems] = useState<Product[]>([product]);
  useEffect(() => {
    if (!product.ownerId) return;
    void api(`/api/users/${product.ownerId}`)
      .then((data) => {
        setSeller(data.seller);
        setFollow(Boolean(data.seller?.followedByMe));
        setProfileItems(data.listings.map(listingToProduct));
      })
      .catch((error) => setNotice((error as Error).message));
  }, [product.ownerId]);
  const sellerName = seller?.name || product.seller;
  const sellerAvatar = seller?.avatar || product.sellerAvatar || hiveLogoSmall;
  const sellerTags = [seller?.campus, seller?.gender, seller?.age, seller?.sign, seller?.interests].filter(Boolean);
  const toggleFollow = async () => {
    if (!product.ownerId) return;
    try {
      const data = await api("/api/activity/follow", "PUT", { sellerId: product.ownerId });
      setFollow((current) => !current);
      setSeller((current: any) => current ? { ...current, followers: Math.max(0, Number(current.followers || 0) + (follow ? -1 : 1)) } : current);
      if (!Array.isArray(data.followingIds)) throw new Error("Could not update following.");
    } catch (error) { setNotice((error as Error).message); }
  };
  return (
    <div className="relative h-full overflow-y-auto scrollbar-hide bg-[#F7F7F7]">
      <div className="relative min-h-[458px] text-white overflow-hidden">
        <img
          src={product.images[1] || product.images[0]}
          alt="Seller profile background"
          className="absolute inset-0 w-full h-full object-cover scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/35 to-black/75" />
        <StatusBar light />
        <div className="relative px-4 flex justify-between">
          <button onClick={onBack} className="floating-icon">
            <ArrowLeft />
          </button>
          <button
            onClick={() => setActionsOpen(true)}
            className="floating-icon"
          >
            <MoreHorizontal />
          </button>
        </div>
        <div className="absolute inset-x-4 top-[102px]">
          <div className="flex items-center gap-3">
            <img
              src={sellerAvatar}
              className="w-[62px] h-[62px] rounded-full object-cover border-2 border-white/90 shadow-lg"
            />
            <div className="min-w-0 flex-1">
              <h1 className="text-[19px] font-bold one-line">
                {sellerName}
              </h1>
              <p className="text-[10px] text-white/75 mt-1 one-line">
                {seller?.verified ? "Verified student" : "Student"}{seller?.campus ? ` · ${seller.campus}` : ""}
              </p>
            </div>
          </div>
          <div className="profile-hero-stats mt-5">
            <span>
              <b>{follow ? 1 : 0}</b> Following
            </span>
            <span>
              <b>{Number(seller?.followers || 0)}</b> Followers
            </span>
            <span>
              <b>●</b> {seller ? "Profile active" : "Loading…"}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-4">
            {sellerTags.map((x: string) => (
              <span key={x} className="hero-tag">
                {x}
              </span>
            ))}
          </div>
          <p className="text-[11px] text-white/88 leading-relaxed mt-4 max-w-[350px]">
            {seller?.bio || "This seller has not added a profile bio yet."}
          </p>
          <div className="flex gap-2 mt-5">
            <button
              onClick={toggleFollow}
              className="glass-button glass-accent flex-1 h-10 text-[9px] font-semibold text-black"
            >
              {follow ? "Following" : "Follow"}
            </button>
            <button
              onClick={onMessage}
              className="glass-button hero-message flex-1 h-10 text-[10px] font-semibold"
            >
              <MessageCircle size={15} /> Message
            </button>
          </div>
        </div>
      </div>
      <div className="relative -mt-5 rounded-t-[26px] bg-white px-3 pt-4 min-h-[390px]">
        {notice && <p className="field-hint text-center mb-3">{notice}</p>}
        <div className="profile-tabs">
          <button
            onClick={() => setTab("listings")}
            className={tab === "listings" ? "active" : ""}
          >
            Listings · {profileItems.length}
          </button>
          <button
            onClick={() => setTab("reviews")}
            className={tab === "reviews" ? "active" : ""}
          >
            Reviews · 0
          </button>
        </div>
        {tab === "listings" ? (
          <div className="grid grid-cols-2 gap-2.5 py-3">
            {profileItems.map((p) => (
              <button
                key={`${product.id}-${p.id}`}
                onClick={() => onProduct(p)}
                className="rounded-2xl bg-white overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,.05)]"
              >
                <img src={p.images[0]} className="w-full h-40 object-cover" />
                <div className="p-3">
                  <p className="text-xs font-semibold line-clamp-1">
                    {p.title}
                  </p>
                  <p className="font-bold mt-1" style={{ color: "#F29A00" }}>
                    {fmt(p.price)}
                  </p>
                </div>
              </button>
            ))}
            {!profileItems.length && <p className="col-span-2 text-center text-xs text-gray-400 py-8">No active listings yet.</p>}
          </div>
        ) : (
          <p className="py-10 text-center text-xs text-gray-400">No verified reviews yet.</p>
        )}
      </div>
      {actionsOpen && (
        <div
          className="absolute inset-0 z-50 bg-black/25 flex items-end"
          onClick={() => setActionsOpen(false)}
        >
          <div
            className="profile-sheet w-full rounded-t-[26px] p-3 pb-7"
            onClick={(e) => e.stopPropagation()}
          >
            {["Share", "Block", "Report", "Cancel"].map((x) => (
              <button
                key={x}
                onClick={() => {
                  setActionsOpen(false);
                  if (x !== "Cancel") setNotice(`${x} action selected.`);
                }}
                className={x === "Cancel" ? "sheet-cancel" : ""}
              >
                {x}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CartScreen({
  cart,
  onQty,
  onRemove,
  onCheckout,
}: {
  cart: CartItem[];
  onQty: (id: string | number, d: number) => void;
  onRemove: (id: string | number) => void;
  onCheckout: () => void;
}) {
  const [coupon, setCoupon] = useState("");
  const [hint, setHint] = useState("");
  const [discount, setDiscount] = useState(0);
  const { subtotal, tax, protection } = checkoutTotals(cart);
  const total = subtotal + tax + protection - discount;
  const apply = () => {
    if (coupon.toUpperCase() === "HIVE10") {
      setDiscount(Math.min(10, subtotal * 0.1));
      setHint("HIVE10 applied.");
    } else {
      setDiscount(0);
      setHint("Enter HIVE10 to try the prototype discount.");
    }
  };
  return (
    <div className="h-full flex flex-col bg-[#F5F5F5] cart-screen cart-page">
      <header className="bg-white cart-header-liquid">
        <StatusBar />
        <div className="px-5 pb-4">
          <h1 className="text-2xl font-bold">Cart</h1>
          <p className="text-sm text-gray-400">
            {cart.length} item{cart.length === 1 ? "" : "s"}
          </p>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto px-4 py-3 pb-40 space-y-3">
        {!cart.length ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <ShoppingCart size={48} />
            <p className="mt-3 text-sm">Your cart is empty</p>
          </div>
        ) : (
          <>
            {cart.map(({ product, qty }) => (
              <div
                key={product.id}
                className="cart-item bg-white rounded-2xl p-3 flex gap-3"
              >
                <img
                  src={product.images[0]}
                  className="w-20 h-20 rounded-xl object-cover"
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold line-clamp-1">
                    {product.title}
                  </p>
                  <p className="font-bold mt-1" style={{ color: "#F29A00" }}>
                    {fmt(product.price)}
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    <button
                      onClick={() => onQty(product.id, -1)}
                      className="qty"
                    >
                      −
                    </button>
                    <span className="text-sm">{qty}</span>
                    <button
                      onClick={() => onQty(product.id, 1)}
                      className="qty"
                    >
                      +
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => onRemove(product.id)}
                  className="p-2 self-start"
                >
                  <Trash2 size={17} color={GRAY} />
                </button>
              </div>
            ))}
            <div className="coupon-card bg-white rounded-2xl p-4">
              <div className="input-shell rounded-xl bg-gray-100 flex items-center px-3">
                <Tag size={16} />
                <input
                  value={coupon}
                  onChange={(e) => {
                    setCoupon(e.target.value);
                    setHint("");
                  }}
                  className="input-core flex-1 h-11 bg-transparent px-2 text-sm"
                  placeholder="Coupon code"
                />
                <button
                  onClick={apply}
                  className="px-4 py-2 rounded-full text-xs font-bold"
                  style={{ background: Y }}
                >
                  Apply
                </button>
              </div>
              {hint && <p className="field-hint">{hint}</p>}
            </div>
            <div className="bill-dark bg-white rounded-2xl p-5 text-sm space-y-3">
              <h2 className="font-bold text-base">Bill Summary</h2>
              <div className="bill">
                <span>Subtotal</span>
                <b>${subtotal.toFixed(2)}</b>
              </div>
              <div className="bill">
                <span>Estimated tax (9.5%)</span>
                <b>${tax.toFixed(2)}</b>
              </div>
              <div className="bill">
                <span>Purchase protection</span>
                <b>${protection.toFixed(2)}</b>
              </div>
              {discount > 0 && (
                <div className="bill" style={{ color: ERROR }}>
                  <span>Discount</span>
                  <b>−${discount.toFixed(2)}</b>
                </div>
              )}
              <div className="bill border-t pt-3 text-base text-black">
                <b>Total</b>
                <b>${total.toFixed(2)}</b>
              </div>
            </div>
          </>
        )}
      </main>
      <div className="absolute left-3 right-3 bottom-[92px] z-20 glass-checkout-bar p-2">
        <button
          disabled={!cart.length}
          onClick={onCheckout}
          className="glass-button glass-accent w-full h-12 text-[11px] font-semibold"
          style={{ background: cart.length ? Y : "#E5E5E5" }}
        >
          Checkout
        </button>
      </div>
    </div>
  );
}

function CheckoutScreen({
  items,
  onBack,
  onComplete,
}: {
  items: CartItem[];
  onBack: () => void;
  onComplete: () => void;
}) {
  const [method, setMethod] = useState<"meetup" | "delivery">("meetup");
  const [picker, setPicker] = useState(false);
  const [place, setPlace] = useState("USC Village");
  const [customPlace, setCustomPlace] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("CA");
  const [zip, setZip] = useState("");
  const [payment, setPayment] = useState("card");
  const [hint, setHint] = useState("");
  const [cardSaved, setCardSaved] = useState(true);
  const [cardForm, setCardForm] = useState(false);
  const [venmo, setVenmo] = useState("");
  const [venmoConnected, setVenmoConnected] = useState(false);
  const { subtotal, tax, protection, total } = checkoutTotals(items);
  const pay = () => {
    if (
      method === "delivery" &&
      (!address1.trim() ||
        !city.trim() ||
        !state.trim() ||
        !/^[0-9]{5}$/.test(zip))
    ) {
      setHint(
        "Please complete Address Line 1, City, State, and a 5-digit ZIP code.",
      );
      return;
    }
    if (method === "meetup" && !place.trim()) {
      setHint("Please choose or enter a meetup location.");
      return;
    }
    if (payment === "card" && !cardSaved) {
      setHint("Please add and save a card before paying.");
      return;
    }
    if (payment === "venmo" && !venmoConnected) {
      setHint("Please connect your Venmo account first.");
      return;
    }
    setHint("");
    onComplete();
  };
  return (
    <div className="h-full flex flex-col bg-[#F5F5F5] checkout-screen checkout-page">
      <header className="bg-white checkout-header-liquid">
        <StatusBar />
        <div className="px-4 pb-4 flex items-center gap-3">
          <button
            onClick={onBack}
            className="icon-button p-2 rounded-full bg-gray-100"
          >
            <ArrowLeft size={19} />
          </button>
          <div>
            <h1 className="text-xl font-bold">Secure Checkout</h1>
            <p className="text-xs text-gray-400">
              Protected campus transaction
            </p>
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        <section className="checkout-card checkout-section">
          <h2>Fulfillment</h2>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <button
              onClick={() => {
                setMethod("meetup");
                setHint("");
              }}
              className={`choice ${method === "meetup" ? "chosen" : ""}`}
            >
              <MapPin size={19} />
              <b>Campus meetup</b>
              <span>Free</span>
            </button>
            <button
              onClick={() => {
                setMethod("delivery");
                setHint("");
              }}
              className={`choice ${method === "delivery" ? "chosen" : ""}`}
            >
              <Truck size={19} />
              <b>Delivery</b>
              <span>Enter address</span>
            </button>
          </div>
          {method === "meetup" ? (
            <>
              <button
                onClick={() => setPicker((v) => !v)}
                className="input-shell mt-3 w-full rounded-xl bg-gray-100 px-4 h-14 flex items-center justify-between text-left"
              >
                <span>
                  <b className="block text-xs">
                    {place || "Choose meetup location"}
                  </b>
                  <span className="text-[11px] text-gray-400">
                    Tap to select or enter your own
                  </span>
                </span>
                <ChevronDown size={16} />
              </button>
              {picker && (
                <div className="mt-2 border border-gray-100 rounded-2xl p-2">
                  {[
                    "USC Village",
                    "Leavey Library",
                    "Tutor Campus Center",
                    "Public campus safety desk",
                  ].map((x) => (
                    <button
                      key={x}
                      onClick={() => {
                        setPlace(x);
                        setPicker(false);
                      }}
                      className="location-option"
                    >
                      {x}
                    </button>
                  ))}
                  <div className="input-shell rounded-xl bg-gray-100 flex px-3 mt-1">
                    <input
                      value={customPlace}
                      onChange={(e) => setCustomPlace(e.target.value)}
                      className="input-core h-11 flex-1 bg-transparent text-xs"
                      placeholder="Enter another public meetup place"
                    />
                    <button
                      onClick={() => {
                        if (customPlace.trim()) {
                          setPlace(customPlace.trim());
                          setPicker(false);
                        }
                      }}
                    >
                      <Check size={17} />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="mt-3 space-y-2">
              <div className="input-shell rounded-xl bg-gray-100">
                <input
                  value={address1}
                  onChange={(e) => {
                    setAddress1(e.target.value);
                    setHint("");
                  }}
                  className="input-core w-full h-12 bg-transparent px-4 text-sm"
                  placeholder="Address Line 1"
                />
              </div>
              <div className="input-shell rounded-xl bg-gray-100">
                <input
                  value={address2}
                  onChange={(e) => setAddress2(e.target.value)}
                  className="input-core w-full h-12 bg-transparent px-4 text-sm"
                  placeholder="Address Line 2 (optional)"
                />
              </div>
              <div className="grid grid-cols-[1.4fr_.8fr_.8fr] gap-2">
                <div className="input-shell rounded-xl bg-gray-100">
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="input-core w-full h-12 bg-transparent px-3 text-sm"
                    placeholder="City"
                  />
                </div>
                <div className="input-shell rounded-xl bg-gray-100">
                  <input
                    value={state}
                    onChange={(e) =>
                      setState(e.target.value.toUpperCase().slice(0, 2))
                    }
                    className="input-core w-full h-12 bg-transparent px-3 text-sm"
                    placeholder="State"
                  />
                </div>
                <div className="input-shell rounded-xl bg-gray-100">
                  <input
                    value={zip}
                    onChange={(e) =>
                      setZip(e.target.value.replace(/\D/g, "").slice(0, 5))
                    }
                    className="input-core w-full h-12 bg-transparent px-3 text-sm"
                    placeholder="ZIP"
                    inputMode="numeric"
                  />
                </div>
              </div>
            </div>
          )}
        </section>
        <section className="checkout-card checkout-section">
          <h2>Payment method</h2>
          <p className="checkout-demo-note">Demo checkout — no payment information is stored or charged yet.</p>
          <div className="grid grid-cols-3 gap-2 mt-3">
            {[
              { id: "card", I: CreditCard, label: "Card" },
              { id: "venmo", I: Wallet, label: "Venmo" },
              { id: "pickup", I: CircleDollarSign, label: "At pickup" },
            ].map(({ id, I, label }) => (
              <button
                key={id}
                onClick={() => {
                  setPayment(id);
                  setHint("");
                }}
                className={`choice items-center ${payment === id ? "chosen" : ""}`}
              >
                <I size={18} />
                <b>{label}</b>
              </button>
            ))}
          </div>
          {payment === "card" && (
            <div className="mt-3">
              {cardSaved && !cardForm ? (
                <div className="saved-payment">
                  <CreditCard size={20} />
                  <div className="flex-1">
                    <b>Visa ending in 4242</b>
                    <span>Expires 08/29</span>
                  </div>
                  <Check size={18} />
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="input-shell rounded-xl bg-gray-100">
                    <input
                      className="input-core w-full h-12 bg-transparent px-4 text-sm"
                      placeholder="Name on card"
                    />
                  </div>
                  <div className="input-shell rounded-xl bg-gray-100">
                    <input
                      className="input-core w-full h-12 bg-transparent px-4 text-sm"
                      placeholder="Card number"
                      inputMode="numeric"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="input-shell rounded-xl bg-gray-100">
                      <input
                        className="input-core w-full h-12 bg-transparent px-4 text-sm"
                        placeholder="MM/YY"
                      />
                    </div>
                    <div className="input-shell rounded-xl bg-gray-100">
                      <input
                        className="input-core w-full h-12 bg-transparent px-4 text-sm"
                        placeholder="CVC"
                        inputMode="numeric"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setCardSaved(true);
                      setCardForm(false);
                      setHint("Card saved securely.");
                    }}
                    className="action-button w-full h-11 rounded-xl text-xs font-semibold"
                    style={{ background: Y }}
                  >
                    Save card
                  </button>
                </div>
              )}
              <button
                onClick={() => {
                  setCardForm(true);
                  setCardSaved(false);
                }}
                className="mt-3 text-xs font-semibold underline"
              >
                + Add another card
              </button>
            </div>
          )}
          {payment === "venmo" && (
            <div className="mt-3">
              <div className="input-shell rounded-xl bg-gray-100 flex items-center px-3">
                <span className="text-sm font-bold">@</span>
                <input
                  value={venmo}
                  onChange={(e) => setVenmo(e.target.value)}
                  className="input-core h-12 flex-1 bg-transparent px-2 text-sm"
                  placeholder="Venmo username"
                />
              </div>
              <button
                onClick={() => {
                  if (venmo.trim()) {
                    setVenmoConnected(true);
                    setHint("Venmo account connected.");
                  }
                }}
                className="action-button mt-2 w-full h-11 rounded-xl text-xs font-semibold"
                style={{ background: Y }}
              >
                {venmoConnected ? "Venmo Connected" : "Connect Venmo"}
              </button>
              <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">
                You will confirm the payment in Venmo before Hive completes the
                order.
              </p>
            </div>
          )}
          {payment === "pickup" && (
            <div className="mt-3 rounded-xl bg-[#FFFBEB] p-3">
              <p className="text-xs text-gray-600 leading-relaxed">
                Pay only after you inspect the item at the agreed public meetup.
                Hive will remind both people to confirm the exchange.
              </p>
            </div>
          )}
        </section>
        <section className="checkout-card checkout-section">
          <h2>Order summary</h2>
          {items.map(({ product, qty }) => (
            <div
              key={product.id}
              className="flex gap-3 items-center py-3 border-b border-gray-100"
            >
              <img
                src={product.images[0]}
                className="w-11 h-11 rounded-lg object-cover"
              />
              <p className="flex-1 text-xs font-semibold line-clamp-1">
                {product.title} × {qty}
              </p>
              <b className="text-xs">${(product.price * qty).toFixed(2)}</b>
            </div>
          ))}
          <div className="bill mt-3">
            <span>Subtotal</span>
            <b>${subtotal.toFixed(2)}</b>
          </div>
          <div className="bill mt-2">
            <span>Estimated tax</span>
            <b>${tax.toFixed(2)}</b>
          </div>
          <div className="bill mt-2">
            <span>Purchase protection</span>
            <b>${protection.toFixed(2)}</b>
          </div>
          <div className="bill border-t mt-3 pt-3 text-base">
            <b>Total</b>
            <b>${total.toFixed(2)}</b>
          </div>
        </section>
        {hint && <p className="field-hint text-center">{hint}</p>}
        <p className="text-[10px] text-gray-400 text-center flex justify-center gap-1">
          <ShieldCheck size={13} />
          Your payment details are encrypted
        </p>
      </main>
      <div className="bg-white px-4 pt-3 pb-7">
        <button
          onClick={pay}
          className="pressable w-full h-14 rounded-2xl font-bold"
          style={{ background: Y }}
        >
          <LockKeyhole size={15} className="inline mr-2" />
          Pay ${total.toFixed(2)}
        </button>
      </div>
    </div>
  );
}

function MessagesList({ onOpen }: { onOpen: (dm: DM) => void }) {
  const [q, setQ] = useState("");
  const [conversations, setConversations] = useState<DM[]>([]);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    const loadConversations = () => api("/api/conversations")
      .then((data) => setConversations((data.conversations || []).map(conversationToDm).filter(Boolean)))
      .catch((error) => setNotice((error as Error).message));
    void loadConversations();
    const refresh = window.setInterval(() => void loadConversations(), 3000);
    return () => window.clearInterval(refresh);
  }, []);
  const unreadTotal = conversations.reduce((total, conversation) => total + conversation.unread, 0);
  return (
    <div className="h-full flex flex-col bg-white messages-screen messages-page">
      <header className="messages-header-liquid">
        <StatusBar />
        <div className="px-5 pb-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Messages</h1>
          {unreadTotal > 0 && (
            <span className="min-w-6 h-6 px-2 rounded-full bg-[#FAC515] text-xs font-bold flex items-center justify-center">
              {unreadTotal > 99 ? "99+" : unreadTotal}
            </span>
          )}
        </div>
        <div className="px-4 pb-3">
          <div className="input-shell rounded-2xl bg-gray-100 px-4 flex items-center gap-2">
            <Search size={15} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="input-core h-11 flex-1 bg-transparent text-sm"
              placeholder="Search conversations..."
            />
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto border-t border-gray-100">
        {notice && <p className="p-4 text-center text-xs text-gray-400">{notice}</p>}
        {!notice && !conversations.length && <p className="p-8 text-center text-xs text-gray-400">No conversations yet. Open a listing and tap Message to start one.</p>}
        {conversations
          .filter((d) => d.name.toLowerCase().includes(q.toLowerCase()))
          .map((dm) => {
            const p = productForDm(dm);
            return (
              <button
                key={dm.id}
                onClick={() => onOpen(dm)}
                className="conversation-card pressable w-full p-4 flex gap-3 text-left border-b border-gray-100"
              >
                <div className="relative">
                  <img
                    src={dm.avatar}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  {dm.online && (
                    <span className="absolute right-0 bottom-0 w-3 h-3 rounded-full bg-[#E1B12C] border-2 border-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between">
                    <b className="text-sm">{dm.name}</b>
                    <span className="text-[10px] text-gray-400">{dm.time}</span>
                  </div>
                  <p className="text-xs text-gray-400 truncate mt-1">
                    {dm.last}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1 truncate">
                    About: {p.title}
                  </p>
                </div>
                {dm.unread > 0 && (
                  <span className="badge static mt-5">{dm.unread}</span>
                )}
              </button>
            );
          })}
      </main>
    </div>
  );
}

function ChatScreen({
  dm,
  onBack,
  onSeller,
  onProduct,
}: {
  dm: DM;
  onBack: () => void;
  onSeller: () => void;
  onProduct: () => void;
}) {
  const p = productForDm(dm);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [hint, setHint] = useState("");
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  useEffect(() => {
    if (String(dm.id).startsWith("listing-")) return;
    const loadConversation = () => api("/api/conversations")
      .then((data) => {
        const conversation = (data.conversations || []).find((item: any) => String(item.id) === String(dm.id));
        if (!conversation) return;
        setMessages((conversation.messages || []).map((message: any) => ({
          from: message.mine ? "me" : "them",
          text: String(message.text),
          time: message.createdAt ? new Date(message.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "",
          read: Boolean(message.read),
        })));
        void api(`/api/conversations/${dm.id}/read`, "PUT").catch(() => {});
      })
      .catch((error) => setHint((error as Error).message));
    void loadConversation();
    const refresh = window.setInterval(() => void loadConversation(), 3000);
    return () => window.clearInterval(refresh);
  }, [dm.id]);
  const send = async () => {
    if (!text.trim()) return;
    if (!dm.recipientId) {
      setHint("This listing does not have a messageable seller yet.");
      return;
    }
    const sent = text.trim();
    try {
      const data = await api("/api/conversations", "POST", {
        recipientId: dm.recipientId,
        listingId: String(p.id),
        text: sent,
      });
      setMessages((v) =>
        [...v, {
          from: "me",
          text: data.message.text,
          time: new Date(data.message.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
          read: false,
        }],
      );
      setText("");
      setHint("Message sent");
    } catch (error) { setHint((error as Error).message); }
  };
  return (
    <div className="h-full flex flex-col bg-[#F5F5F5] chat-screen chat-page">
      <header className="bg-white border-b border-gray-100 chat-header-liquid">
        <StatusBar />
        <div className="px-4 pb-3 flex items-center gap-3">
          <button onClick={onBack} className="icon-button p-2">
            <ArrowLeft size={21} />
          </button>
          <button
            onClick={onSeller}
            className="flex items-center gap-2 flex-1 text-left"
          >
            <img
              src={dm.avatar}
              className="w-9 h-9 rounded-full object-cover"
            />
            <div>
              <b className="text-sm">{dm.name}</b>
              <p className="text-[10px] text-gray-400">
                Messages are saved to Hive
              </p>
            </div>
          </button>
          <button
            onClick={() => setHint("Conversation actions opened.")}
            className="p-2"
          >
            <MoreHorizontal size={20} />
          </button>
        </div>
        <button
          onClick={onProduct}
          className="chat-listing w-full px-4 py-2.5 flex items-center gap-3 text-left bg-[#FFFBEB] border-t border-[#F2E6B4]"
        >
          <img
            src={p.images[0]}
            className="w-12 h-12 rounded-lg object-cover"
          />
          <div className="flex-1">
            <p className="text-xs font-semibold line-clamp-1">{p.title}</p>
            <p className="text-sm font-bold mt-1" style={{ color: "#F29A00" }}>
              {fmt(p.price)}
            </p>
          </div>
          <span className="text-[11px] text-gray-500">View item</span>
          <ChevronRight size={15} />
        </button>
      </header>
      <main className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}
          >
            <div className="max-w-[76%]">
              <div
                className={`chat-bubble ${m.from === "me" ? "mine" : "theirs"}`}
              >
                {m.text}
              </div>
              <p
                className={`text-[9px] text-gray-400 mt-1 ${m.from === "me" ? "text-right" : ""}`}
              >
                {m.time}
                {m.from === "me" ? m.read ? " · Read" : " · Sent" : ""}
              </p>
            </div>
          </div>
        ))}
        <div ref={end} />
      </main>
      {hint && <p className="text-center text-[10px] text-gray-400">{hint}</p>}
      <div className="chat-composer bg-white border-t border-gray-100 px-3 pt-2 pb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setHint("Voice messages are not available yet.")}
            className="chat-tool"
          >
            <Mic size={20} />
          </button>
          <div className="input-shell flex-1 rounded-[20px] bg-gray-100 px-3 flex items-center">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
              className="input-core h-11 flex-1 bg-transparent text-sm"
              placeholder="Message..."
            />
            <button onClick={() => setText((v) => v + " 😊")} className="p-1">
              <Smile size={20} />
            </button>
          </div>
          <button
            onClick={() => setHint("Photo and file messages are not available yet.")}
            className="chat-tool"
          >
            <Plus size={22} />
          </button>
          <button
            onClick={send}
            className="chat-tool"
            style={{ background: Y }}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
function PostScreen({
  onReview,
  onClose,
}: {
  onReview: (d: Draft) => void;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState("");
  const [status, setStatus] = useState("");
  const [showSourcePicker, setShowSourcePicker] = useState(false);
  const library = useRef<HTMLInputElement>(null);
  const camera = useRef<HTMLInputElement>(null);
  const readFile = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  const analyze = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    setStatus("Uploading securely for Gemini photo analysis...");
    let image = "";
    try {
      image = await readFile(file);
      setPreview(image);
      const response = await fetch("/api/analyze-item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, filename: file.name }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "AI analysis could not be completed.");
      onReview({
        title: data.title,
        description: data.description,
      price: String(data.recommended_listing_price),
        category: data.category,
        condition: data.condition || "Good",
        image,
      });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "AI analysis could not be completed.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="h-full bg-white overflow-y-auto post-screen post-page pb-24">
      <StatusBar />
      <div className="px-5 flex justify-between">
        <h1 className="text-xl font-bold">Sell an Item</h1>
        <button onClick={onClose}>
          <X />
        </button>
      </div>
      <div className="p-5 pt-7">
        <input
          ref={library}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => analyze(e.target.files?.[0])}
        />
        <input
          ref={camera}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => analyze(e.target.files?.[0])}
        />
        <button
          onClick={() => setShowSourcePicker(true)}
          className="post-photo-target pressable w-full rounded-[26px] bg-white flex flex-col items-center justify-center overflow-hidden"
        >
          {preview ? (
            <img src={preview} className="w-full h-full object-cover" />
          ) : busy ? (
            <>
              <Sparkles size={30} />
              <b className="mt-3">Analyzing your photo...</b>
            </>
          ) : (
            <>
              <Camera size={32} />
              <b className="mt-3">Add an item photo</b>
              <p className="text-xs text-gray-400 mt-2">
                Take a photo or choose one from your library.
              </p>
            </>
          )}
        </button>
        {status && <p className="field-hint text-center mt-4">{status}</p>}
        <div className="post-ai-card rounded-2xl bg-[#FFFBEB] p-4 mt-4">
          <p className="text-xs font-bold flex items-center gap-2">
            <Sparkles size={14} />
            Gemini creates a complete draft
          </p>
          <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">
            Gemini analyzes the photo and proposes a title, description,
            category, condition, and estimated price. You always review before
            publishing.
          </p>
        </div>
      </div>
      {showSourcePicker && <div className="photo-source-overlay" onClick={() => setShowSourcePicker(false)}>
        <div className="photo-source-sheet" onClick={(event) => event.stopPropagation()}>
          <div className="photo-source-handle" />
          <h2>Add an item photo</h2>
          <button onClick={() => { setShowSourcePicker(false); camera.current?.click(); }}><Camera size={23} />Take a Photo</button>
          <button onClick={() => { setShowSourcePicker(false); library.current?.click(); }}><ImageIcon size={23} />Choose from Library</button>
          <button className="photo-source-cancel" onClick={() => setShowSourcePicker(false)}>Cancel</button>
        </div>
      </div>}
    </div>
  );
}
function PostReview({
  draft,
  onPublish,
  onClose,
}: {
  draft: Draft;
  onPublish: (draft: Draft) => void;
  onClose: () => void;
}) {
  const [d, setD] = useState(draft);
  return (
    <div className="h-full overflow-y-auto bg-white">
      <StatusBar />
      <div className="px-5 flex justify-between">
        <h1 className="text-xl font-bold">Review Listing</h1>
        <button onClick={onClose}>
          <X />
        </button>
      </div>
      <div className="p-5 space-y-4">
        <img src={d.image} className="w-full h-56 object-cover rounded-2xl" />
        {(["title", "description", "price"] as const).map((k) => (
          <label key={k} className="block">
            <span className="text-xs font-bold uppercase text-gray-400">
              {k}
            </span>
            <div className="input-shell mt-1 rounded-xl bg-gray-100">
              <input
                value={d[k]}
                onChange={(e) => setD({ ...d, [k]: e.target.value })}
                className="input-core w-full h-12 bg-transparent px-4 text-sm"
              />
            </div>
          </label>
        ))}
        <div className="grid grid-cols-2 gap-2">
          <select
            value={d.category}
            onChange={(e) => setD({ ...d, category: e.target.value })}
            className="h-12 rounded-xl bg-gray-100 px-3 text-sm"
          >
            {categories.slice(1).map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select
            value={d.condition}
            onChange={(e) => setD({ ...d, condition: e.target.value })}
            className="h-12 rounded-xl bg-gray-100 px-3 text-sm"
          >
            {["New", "Like New", "Great", "Good", "Used"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => onPublish(d)}
          className="pressable w-full h-14 rounded-2xl font-bold"
          style={{ background: Y }}
        >
          Publish Listing
        </button>
      </div>
    </div>
  );
}

function OwnProfile({
  user,
  activity,
  onEdit,
  onOpen,
  onSignOut,
}: {
  user: UserInfo;
  activity: { saved: number; viewed: number; following: number; coupons: number };
  onEdit: () => void;
  onOpen: (t: string) => void;
  onSignOut: () => void;
}) {
  return (
    <div className="h-full overflow-y-auto bg-[#F5F5F5] profile-screen profile-page">
      <header className="bg-white profile-header profile-header-material">
        <StatusBar />
        <div className="px-5 pb-5">
          <div className="flex justify-between">
            <h1 className="text-2xl font-bold">Profile</h1>
            <button onClick={onEdit} className="text-sm font-semibold">
              Edit
            </button>
          </div>
          <div className="flex items-center gap-4 mt-4">
            <img
              src={user.avatar || hiveLogoSmall}
              onError={(event) => { event.currentTarget.src = hiveLogoSmall; }}
              className="w-20 h-20 rounded-full object-cover"
            />
            <div>
              <h2 className="text-xl font-bold">{user.name}</h2>
              <p className="text-sm text-gray-500 mt-1">
                {user.school} '{user.grad} · {user.campus}
              </p>
              <p className="text-xs mt-2">⭐ New to Hive · 0 reviews</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap mt-4">
            {[user.gender, user.age, user.sign, user.interests]
              .filter(Boolean)
              .map((x) => (
                <span key={x} className="profile-tag">
                  {x}
                </span>
              ))}
          </div>
          {user.bio && (
            <p className="text-xs text-gray-500 leading-relaxed mt-3">
              {user.bio}
            </p>
          )}
          <div className="profile-stats grid grid-cols-4 mt-5 rounded-2xl bg-gray-50 py-4">
            {[
              {
                n: String(activity.saved),
                l: "Saved",
                t: "Saved Items",
              },
              {
                n: String(activity.viewed),
                l: "Viewed",
                t: "Browsing History",
              },
              {
                n: String(activity.following),
                l: "Following",
                t: "Following",
              },
              { n: String(activity.coupons), l: "Coupons", t: "Coupons" },
            ].map((x) => (
              <button
                key={x.l}
                onClick={() => onOpen(x.t)}
                className="text-center"
              >
                <b className="block text-lg">{x.n}</b>
                <span className="text-[10px] text-gray-400">{x.l}</span>
              </button>
            ))}
          </div>
        </div>
      </header>
      <main className="p-4 space-y-3">
        <section className="profile-panel bg-white rounded-2xl p-4">
          <h2 className="font-bold">My transactions</h2>
          <div className="grid grid-cols-4 mt-4 gap-2">
            {[
              { I: Package, l: "Listed", t: "My Listings" },
              { I: CircleDollarSign, l: "Sold", t: "Sold Items" },
              { I: ShoppingCart, l: "Bought", t: "Bought Items" },
              { I: Star, l: "Reviews", t: "My Reviews" },
            ].map(({ I, l, t }) => (
              <button key={l} onClick={() => onOpen(t)} className="text-center">
                <span className="w-11 h-11 rounded-full bg-gray-50 mx-auto flex items-center justify-center">
                  <I size={20} />
                </span>
                <span className="text-[11px] mt-2 block">{l}</span>
              </button>
            ))}
          </div>
        </section>
        <section className="profile-panel bg-white rounded-2xl overflow-hidden">
          {[
            { I: CreditCard, l: "Payment Methods" },
            { I: ShieldCheck, l: `${user.school} Verification` },
            { I: Bell, l: "Notifications" },
            { I: Settings, l: "Settings" },
          ].map(({ I, l }) => (
            <button
              key={l}
              onClick={() =>
                onOpen(l.includes("Verification") ? "School Verification" : l)
              }
              className="pressable w-full px-4 py-4 flex items-center gap-3 border-b border-gray-50"
            >
              <I size={19} />
              <span className="flex-1 text-left text-sm font-medium">{l}</span>
              <ChevronRight size={16} />
            </button>
          ))}
        </section>
        <button
          onClick={onSignOut}
          className="w-full h-12 rounded-xl bg-white font-semibold flex items-center justify-center gap-2"
          style={{ color: ERROR }}
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </main>
    </div>
  );
}

function EditProfile({
  user,
  onBack,
  onSave,
}: {
  user: UserInfo;
  onBack: () => void;
  onSave: (u: UserInfo) => void;
}) {
  const [draft, setDraft] = useState(user);
  const picker = useRef<HTMLInputElement>(null);
  const choose = (file?: File) => {
    if (!file) return;
    const r = new FileReader();
    r.onload = () => setDraft((v) => ({ ...v, avatar: String(r.result) }));
    r.readAsDataURL(file);
  };
  const fields = [
    "name",
    "school",
    "grad",
    "gender",
    "age",
    "interests",
  ] as const;
  return (
    <div className="h-full overflow-y-auto bg-[#F5F5F5] edit-profile-screen edit-profile-page">
      <header className="bg-white edit-profile-header">
        <StatusBar />
        <div className="px-4 pb-4 flex items-center gap-3">
          <button onClick={onBack} className="p-2 edit-profile-back-button">
            <ArrowLeft />
          </button>
          <h1 className="text-xl font-bold">Edit Profile</h1>
        </div>
      </header>
      <main className="p-4 pb-8 edit-profile-main">
        <input
          ref={picker}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => choose(e.target.files?.[0])}
        />
        <div className="edit-profile-card">
          <button
            onClick={() => picker.current?.click()}
            className="mx-auto block relative"
          >
            <img
              src={draft.avatar || hiveLogoSmall}
              onError={(event) => { event.currentTarget.src = hiveLogoSmall; }}
              className="w-24 h-24 rounded-full object-cover"
            />
            <span
              className="absolute right-0 bottom-0 w-9 h-9 rounded-full flex items-center justify-center border-2 border-white"
              style={{ background: Y }}
            >
              <Camera size={17} />
            </span>
          </button>
          <p className="text-center text-xs text-gray-400 mt-2">
            Change profile photo
          </p>
          <div className="edit-profile-grid grid grid-cols-2 gap-3 mt-6">
            {fields.map((k) => (
            <label
              key={k}
              className={k === "interests" ? "col-span-2" : ""}
            >
              <span className="text-[10px] uppercase text-gray-400">{k}</span>
              <div className="input-shell mt-1 rounded-xl bg-white">
                <input
                  value={draft[k]}
                  onChange={(e) => setDraft({ ...draft, [k]: e.target.value })}
                  className="input-core h-12 w-full bg-transparent px-3 text-sm"
                />
              </div>
            </label>
            ))}
            <label className="col-span-2">
              <span className="text-[10px] uppercase text-gray-400">
                About me
              </span>
              <div className="input-shell mt-1 rounded-xl bg-white">
                <textarea
                  value={draft.bio}
                  onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
                  className="input-core w-full min-h-24 bg-transparent px-3 py-3 text-sm resize-none"
                  placeholder="Write a short self-introduction..."
                />
              </div>
            </label>
            <button
              onClick={() => onSave(draft)}
              className="action-button col-span-2 h-12 rounded-xl font-semibold"
              style={{ background: Y }}
            >
              Save changes
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

function SimplePage({
  title,
  onBack,
  user,
  myListings,
  savedProducts,
  historyProducts,
  onProduct,
  onDeleteListings,
  onOpenPage,
}: {
  title: string;
  onBack: () => void;
  user: UserInfo;
  myListings: Product[];
  savedProducts: Product[];
  historyProducts: Product[];
  onProduct: (product: Product) => void;
  onDeleteListings: (products: Product[]) => Promise<void>;
  onOpenPage: (title: string) => void;
}) {
  const [addCard, setAddCard] = useState(false);
  const [cardSaved, setCardSaved] = useState(true);
  const [notifications, setNotifications] = useState({
    messages: true,
    orders: true,
    priceDrops: false,
  });
  const [settings, setSettings] = useState({
    campusOnly: true,
    location: true,
    dark: false,
  });
  const [notice, setNotice] = useState("");
  const [managingListings, setManagingListings] = useState(false);
  const [selectedListingIds, setSelectedListingIds] = useState<string[]>([]);
  const emptyText: Record<string, string> = {
    "My Listings": "You have not listed any items yet.",
    "Sold Items": "You have not sold any items yet.",
    "Bought Items": "You have not bought any items yet.",
  };
  const reviews: Array<{ name: string; avatar: string; text: string; date: string }> = [];
  const toggle = (group: "notifications" | "settings", key: string) =>
    group === "notifications"
      ? setNotifications((v) => ({ ...v, [key]: !v[key as keyof typeof v] }))
      : setSettings((v) => ({ ...v, [key]: !v[key as keyof typeof v] }));
  const toggleListingSelection = (listingId: string | number) => {
    const id = String(listingId);
    setSelectedListingIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };
  const finishManagingListings = () => {
    setManagingListings(false);
    setSelectedListingIds([]);
  };
  const deleteSelectedListings = async () => {
    const selected = myListings.filter((listing) => selectedListingIds.includes(String(listing.id)));
    if (!selected.length) return;
    await onDeleteListings(selected);
    finishManagingListings();
  };
  return (
    <div className="h-full bg-[#F5F5F5] simple-page">
      <header className="bg-white simple-header-liquid">
        <StatusBar />
        <div className="px-4 pb-4 flex items-center gap-3">
          <button onClick={onBack} className="p-2">
            <ArrowLeft />
          </button>
          <h1 className="text-xl font-bold">{title}</h1>
        </div>
      </header>
      <main className="p-4 overflow-y-auto">
        {title === "Saved Items" || title === "Browsing History" ? (
          <div className="masonry">
            {(title === "Saved Items" ? savedProducts : historyProducts).map((p) => (
              <div
                key={p.id}
                className="product-card break-inside-avoid mb-3 bg-white rounded-2xl overflow-hidden"
              >
                <img src={p.images[0]} className="w-full h-44 object-cover" />
                <div className="p-3">
                  <p className="text-xs font-semibold line-clamp-1">
                    {p.title}
                  </p>
                  <b className="block mt-2" style={{ color: "#F29A00" }}>
                    {fmt(p.price)}
                  </b>
                </div>
              </div>
            ))}
            {(title === "Saved Items" ? savedProducts : historyProducts).length === 0 && (
              <div className="bg-white rounded-3xl p-10 text-center col-span-2">
                <Package size={38} className="mx-auto text-gray-300" />
                <h2 className="font-bold mt-4">Nothing here yet</h2>
                <p className="text-sm text-gray-400 mt-2">Items you save or open will appear here.</p>
              </div>
            )}
          </div>
        ) : title === "Following" ? (
          <div className="space-y-3">
            {dms.slice(0, 3).map((dm) => (
              <div
                key={dm.id}
                className="bg-white rounded-2xl p-4 flex items-center gap-3"
              >
                <img
                  src={dm.avatar}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <b className="text-sm one-line">{dm.name}</b>
                  <p className="text-xs text-gray-400 mt-1 one-line">
                    Verified campus seller
                  </p>
                </div>
                <button
                  onClick={() => setNotice(`You unfollowed ${dm.name}.`)}
                  className="px-4 h-9 rounded-full text-xs font-semibold"
                  style={{ background: Y }}
                >
                  Following
                </button>
              </div>
            ))}
          </div>
        ) : title === "Coupons" ? (
          <div className="space-y-3">
            {[
              {
                code: "HIVE10",
                value: "10% off",
                note: "Up to $10 on your next order",
              },
              {
                code: "WELCOME5",
                value: "$5 off",
                note: "Orders of $25 or more",
              },
            ].map((c) => (
              <div key={c.code} className="coupon-card">
                <div>
                  <b>{c.value}</b>
                  <p>{c.note}</p>
                </div>
                <button onClick={() => navigator.clipboard?.writeText(c.code)}>
                  {c.code} · Copy
                </button>
              </div>
            ))}
          </div>
        ) : title === "My Listings" && myListings.length ? (
          <>
            <section className="mb-4 rounded-2xl bg-white px-4 py-3 flex items-center justify-between shadow-sm">
              <b className="text-sm">
                {managingListings ? `${selectedListingIds.length} selected` : `${myListings.length} active listing${myListings.length === 1 ? "" : "s"}`}
              </b>
              <div className="flex items-center gap-3">
                {managingListings && selectedListingIds.length > 0 && (
                  <button onClick={() => void deleteSelectedListings()} className="flex items-center gap-1 text-sm font-semibold text-red-600">
                    <Trash2 size={18} /> Delete
                  </button>
                )}
                <button
                  onClick={() => managingListings ? finishManagingListings() : setManagingListings(true)}
                  className="h-10 rounded-full px-5 text-sm font-bold"
                  style={{ background: Y }}
                >
                  {managingListings ? "Done" : "Manage"}
                </button>
              </div>
            </section>
            <div className="grid grid-cols-2 gap-3 items-start">
            {myListings.map((p) => {
              const selected = selectedListingIds.includes(String(p.id));
              return (
              <article
                key={p.id}
                onClick={() => managingListings ? toggleListingSelection(p.id) : onProduct(p)}
                onKeyDown={(event) => { if (event.key === "Enter") managingListings ? toggleListingSelection(p.id) : onProduct(p); }}
                tabIndex={0}
                role="button"
                className={`relative product-card overflow-hidden bg-white rounded-[22px] text-left cursor-pointer shadow-sm ${selected ? "ring-2 ring-[#FAC515]" : ""}`}
              >
                {managingListings && (
                  <span className={`absolute right-3 top-3 z-10 grid h-7 w-7 place-items-center rounded-full border-2 border-white shadow ${selected ? "bg-[#FAC515] text-black" : "bg-white"}`}>
                    {selected && <Check size={17} strokeWidth={3} />}
                  </span>
                )}
                <img src={p.images[0]} className="w-full h-40 object-cover" alt={p.title} />
                <div className="p-3 text-center">
                  <p className="text-xs font-semibold line-clamp-1">{p.title}</p>
                  <b className="block mt-2 text-[19px]" style={{ color: "#F2B900" }}>{fmt(p.price)}</b>
                  <span className="inline-flex mt-2 rounded-full bg-[#FFF2C8] px-3 py-1 text-[10px] font-bold text-[#7C6100]">Listed</span>
                </div>
              </article>
              );
            })}
          </div>
          </>
        ) : title in emptyText ? (
          <div className="bg-white rounded-3xl p-10 text-center">
            <Package size={38} className="mx-auto text-gray-300" />
            <h2 className="font-bold mt-4">Nothing here yet</h2>
            <p className="text-sm text-gray-400 mt-2">{emptyText[title]}</p>
          </div>
        ) : title === "My Reviews" ? (
          <div className="bg-white rounded-2xl px-4">
            {reviews.map((r) => (
              <article key={r.name} className="review-row">
                <img
                  src={r.avatar}
                  alt={r.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="flex justify-between">
                    <b className="text-xs">{r.name}</b>
                    <span className="text-[10px] text-gray-400">{r.date}</span>
                  </div>
                  <p className="text-[11px] mt-1" style={{ color: "#B48800" }}>
                    ★★★★★
                  </p>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                    {r.text}
                  </p>
                </div>
              </article>
            ))}
            {!reviews.length && <p className="py-12 text-center text-sm text-gray-400">No verified reviews yet.</p>}
          </div>
        ) : title === "Payment Methods" ? (
          <div>
            {cardSaved && !addCard && (
              <div className="bg-stone-900 text-white rounded-3xl p-5 h-44 flex flex-col justify-between shadow-lg">
                <div className="flex justify-between">
                  <img src={hiveLogoSmall} className="w-8 h-8" />
                  <CreditCard />
                </div>
                <p className="tracking-[.18em] text-sm">•••• •••• •••• 4242</p>
                <div className="flex justify-between text-xs">
                  <span>{user.name.toUpperCase()}</span>
                  <span>08/29</span>
                </div>
              </div>
            )}
            {addCard && (
              <div className="bg-white rounded-2xl p-4 space-y-2">
                <h2 className="font-bold text-sm">Add a card</h2>
                {["Name on card", "Card number", "MM/YY", "CVC"].map((x) => (
                  <div key={x} className="input-shell rounded-xl bg-gray-100">
                    <input
                      className="input-core w-full h-12 bg-transparent px-4 text-sm"
                      placeholder={x}
                    />
                  </div>
                ))}
                <button
                  onClick={() => {
                    setCardSaved(true);
                    setAddCard(false);
                  }}
                  className="action-button w-full h-11 rounded-xl text-xs font-semibold"
                  style={{ background: Y }}
                >
                  Save card
                </button>
              </div>
            )}
            <button
              onClick={() => {
                setAddCard(true);
                setCardSaved(false);
              }}
              className="action-button mt-4 w-full h-12 rounded-2xl font-semibold text-sm"
              style={{ background: Y }}
            >
              + Add payment method
            </button>
          </div>
        ) : title === "Notifications" ? (
          <div className="bg-white rounded-2xl overflow-hidden">
            {[
              { k: "messages", l: "Messages", s: "New chats and replies" },
              {
                k: "orders",
                l: "Orders",
                s: "Purchases, pickup, and delivery",
              },
              {
                k: "priceDrops",
                l: "Price drops",
                s: "Updates for saved items",
              },
            ].map((x) => (
              <div key={x.k} className="setting-row">
                <div className="flex-1">
                  <b>{x.l}</b>
                  <span>{x.s}</span>
                </div>
                <button
                  onClick={() => toggle("notifications", x.k)}
                  className={`switch ${notifications[x.k as keyof typeof notifications] ? "on" : ""}`}
                >
                  <span />
                </button>
              </div>
            ))}
          </div>
        ) : title === "Settings" ? (
          <div className="space-y-3">
            <div className="bg-white rounded-2xl overflow-hidden">
              {[
                {
                  k: "campusOnly",
                  l: "Campus-only results",
                  s: "Prioritize verified students",
                },
                {
                  k: "location",
                  l: "Use approximate location",
                  s: "Show nearby universities",
                },
                {
                  k: "dark",
                  l: "Dark appearance",
                  s: "Use a darker interface",
                },
              ].map((x) => (
                <div key={x.k} className="setting-row">
                  <div className="flex-1">
                    <b>{x.l}</b>
                    <span>{x.s}</span>
                  </div>
                  <button
                    onClick={() => toggle("settings", x.k)}
                    className={`switch ${settings[x.k as keyof typeof settings] ? "on" : ""}`}
                  >
                    <span />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => onOpenPage("Privacy & Safety")}
              className="pressable w-full h-12 rounded-2xl bg-white text-sm font-semibold"
            >
              Privacy & Safety
            </button>
            <button
              onClick={() => onOpenPage("Terms & Conditions")}
              className="pressable w-full h-12 rounded-2xl bg-white text-sm font-semibold"
            >
              Terms & Conditions
            </button>
          </div>
        ) : title === "Privacy & Safety" ? (
          <PrivacyPolicyContent />
        ) : title === "Terms & Conditions" ? (
          <TermsOfServiceContent />
        ) : title === "School Verification" ? (
          <div className="bg-white rounded-3xl p-8 text-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
              style={{ background: Y }}
            >
              <ShieldCheck size={38} />
            </div>
            <h2 className="text-xl font-bold mt-5">{user.school} Verified</h2>
            <p className="text-sm text-gray-400 mt-2">
              {user.email || "Verified school email"}
            </p>
            <p className="text-xs text-gray-500 mt-5">
              Your school email keeps Hive campus communities safer.
            </p>
          </div>
        ) : null}
        {notice && (
          <button
            onClick={() => setNotice("")}
            className="action-toast"
            aria-label="Dismiss notification"
          >
            {notice}
          </button>
        )}
      </main>
    </div>
  );
}

export default function App() {
  const [active, setActive] = useState<Tab>("home");
  const [screen, setScreen] = useState<Screen>(() => ({
    type: "auth",
    mode:
      location.hash.startsWith("#reset=")
        ? "reset"
        : location.hash === "#signup"
        ? "signup"
        : location.hash === "#verify"
          ? "verify"
          : "login",
  }));
  const [cart, setCart] = useState<CartItem[]>([]);
  const [liveListings, setLiveListings] = useState<Product[]>([]);
  const [myListings, setMyListings] = useState<Product[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [historyIds, setHistoryIds] = useState<string[]>([]);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [coupons, setCoupons] = useState<string[]>([]);
  const [messageUnread, setMessageUnread] = useState(0);
  const [user, setUser] = useState<UserInfo>({
    name: "Bella",
    school: "USC",
    grad: "27",
    campus: "University Park",
    avatar:
      "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=160&h=160&fit=crop",
    gender: "She/Her",
    age: "21",
    sign: "Aquarius",
    interests: "Design · Film · Thrifting",
    bio: "USC design student finding thoughtful secondhand pieces and giving campus items a second life.",
  });
  const refreshListings = async () => {
    try {
      const data = await api("/api/listings");
      const nextListings = data.listings.map(listingToProduct);
      setLiveListings(nextListings);
      return nextListings as Product[];
    } catch {
      // The original demo listings remain visible if the local server is off.
    }
  };
  const refreshCart = async (listings = liveListings) => {
    try {
      const data = await api("/api/cart");
      const nextCart = (data.items || [])
        .map((item: { listingId: string; qty: number }) => {
          const product = listings.find((listing) => String(listing.id) === String(item.listingId));
          return product ? { product, qty: item.qty } : null;
        })
        .filter(Boolean) as CartItem[];
      setCart(nextCart);
    } catch {
      // A cart becomes available after sign-in.
    }
  };
  const saveCart = (nextCart: CartItem[]) => {
    setCart(nextCart);
    void api("/api/cart", "PUT", {
      items: nextCart
        .filter((item) => typeof item.product.id === "string")
        .map((item) => ({ listingId: String(item.product.id), qty: item.qty })),
    }).catch((error) => alert((error as Error).message));
  };
  const refreshMyListings = async () => {
    try {
      const data = await api("/api/profile");
      setMyListings(data.listings.map(listingToProduct));
      if (data.user?.profile) setUser((current) => ({ ...current, ...data.user.profile, email: data.user.email || current.email }));
    } catch {
      // A profile is only available after sign-in.
    }
  };
  const refreshActivity = async () => {
    try {
      const data = await api("/api/activity");
      setSavedIds(data.savedIds || []);
      setHistoryIds(data.historyIds || []);
      setFollowingIds(data.followingIds || []);
      setCoupons(data.coupons || []);
    } catch {
      // Activity belongs to a signed-in user.
    }
  };
  const refreshMessageUnread = async () => {
    try {
      const data = await api("/api/conversations");
      setMessageUnread(Number(data.unreadTotal || 0));
    } catch {
      // The unread count is available after sign-in.
    }
  };
  useEffect(() => {
    void refreshListings().then((listings) => {
      if (listings) void refreshCart(listings);
    });
    void refreshMyListings();
    void refreshActivity();
    void refreshMessageUnread();
    const refresh = window.setInterval(() => void refreshMessageUnread(), 3000);
    return () => window.clearInterval(refresh);
  }, []);
  // The marketplace feed is backed by saved listings only.  Prototype cards are
  // deliberately not mixed into a signed-in user's real data.
  const allListings = liveListings;
  const savedProducts = savedIds.map((id) => allListings.find((item) => String(item.id) === id)).filter(Boolean) as Product[];
  const historyProducts = historyIds.map((id) => allListings.find((item) => String(item.id) === id)).filter(Boolean) as Product[];
  const toggleSaved = async (listingId: string) => {
    try {
      const data = await api("/api/activity/saved", "PUT", { listingId });
      setSavedIds(data.savedIds || []);
    } catch (error) { alert((error as Error).message); }
  };
  const deleteListings = async (listings: Product[]) => {
    if (!listings.length) return;
    const description = listings.length === 1 ? `Delete “${listings[0].title}”?` : `Delete ${listings.length} selected listings?`;
    if (!window.confirm(`${description} This cannot be undone.`)) return;
    try {
      await Promise.all(listings.map((listing) => api(`/api/listings/${listing.id}`, "DELETE")));
      const deletedIds = new Set(listings.map((listing) => String(listing.id)));
      setLiveListings((items) => items.filter((item) => !deletedIds.has(String(item.id))));
      setMyListings((items) => items.filter((item) => !deletedIds.has(String(item.id))));
      setCart((items) => items.filter((item) => !deletedIds.has(String(item.product.id))));
      setSavedIds((items) => items.filter((id) => !deletedIds.has(String(id))));
      setHistoryIds((items) => items.filter((id) => !deletedIds.has(String(id))));
    } catch (error) { alert((error as Error).message); }
  };
  const openProduct = (item: Product) => {
    setScreen({ type: "product", item });
    if (typeof item.id === "string") {
      void api("/api/activity/history", "POST", { listingId: item.id })
        .then((data) => setHistoryIds(data.historyIds || []))
        .catch(() => {});
    }
  };
  const add = (p: Product) => {
    const existing = cart.find((item) => item.product.id === p.id);
    const nextCart = existing
      ? cart.map((item) => (item.product.id === p.id ? { ...item, qty: item.qty + 1 } : item))
      : [...cart, { product: p, qty: 1 }];
    saveCart(nextCart);
  };
  const goMain = (tab = active) => {
    setActive(tab);
    setScreen({ type: "main" });
  };
  const content = () => {
    switch (screen.type) {
      case "auth":
        return (
          <AuthScreen
            mode={screen.mode}
            onMode={(mode) => {
              location.hash =
                mode === "signup"
                  ? "signup"
                  : mode === "verify"
                    ? "verify"
                    : mode === "reset" ? location.hash : "";
              setScreen({ type: "auth", mode });
            }}
            onEnter={(nextUser) => {
              if (nextUser?.profile) setUser((current) => ({ ...current, ...nextUser.profile, email: nextUser.email || current.email }));
              void refreshListings().then((listings) => {
                if (listings) void refreshCart(listings);
              });
              void refreshMyListings();
              void refreshActivity();
              void refreshMessageUnread();
              history.replaceState(null, "", location.pathname);
              goMain("home");
            }}
            onLegal={(title) => setScreen({ type: "auth-legal", title })}
          />
        );
      case "auth-legal":
        return <AuthLegalPage title={screen.title} onBack={() => setScreen({ type: "auth", mode: "signup" })} />;
      case "search":
        return (
          <SearchScreen
            onBack={() => goMain("home")}
            onProduct={openProduct}
            items={allListings}
          />
        );
      case "product":
        return (
          <ProductDetail
            product={screen.item}
            cart={cart}
            onBack={() => goMain("home")}
            onCart={() => goMain("cart")}
            onSave={() => {
              if (typeof screen.item.id === "string") void toggleSaved(screen.item.id);
            }}
            onMessage={() =>
              setScreen({ type: "chat", dm: dmForProduct(screen.item) })
            }
            onSeller={() => setScreen({ type: "seller", item: screen.item })}
            onAdd={() => add(screen.item)}
            onBuy={() => setScreen({ type: "checkout", buyNow: screen.item })}
          />
        );
      case "seller":
        return (
          <SellerProfile
            product={screen.item}
            onBack={() => setScreen({ type: "product", item: screen.item })}
            onProduct={openProduct}
            onMessage={() =>
              setScreen({ type: "chat", dm: dmForProduct(screen.item) })
            }
          />
        );
      case "chat":
        return (
          <ChatScreen
            dm={screen.dm}
            onBack={() => goMain("messages")}
            onSeller={() =>
              setScreen({ type: "seller", item: productForDm(screen.dm) })
            }
            onProduct={() =>
              setScreen({ type: "product", item: productForDm(screen.dm) })
            }
          />
        );
      case "post":
        return (
          <PostScreen
            onClose={() => goMain()}
            onReview={(draft) => setScreen({ type: "post-review", draft })}
          />
        );
      case "post-review":
        return (
          <PostReview
            draft={screen.draft}
            onClose={() => goMain()}
            onPublish={async (draft) => {
              try {
                const data = await api("/api/listings", "POST", draft);
                const listing = listingToProduct(data.listing);
                setLiveListings((current) => [listing, ...current]);
                setMyListings((current) => [listing, ...current]);
                setScreen({ type: "post-success" });
              } catch (error) {
                alert((error as Error).message);
              }
            }}
          />
        );
      case "checkout": {
        const items = screen.buyNow
          ? [{ product: screen.buyNow, qty: 1 }]
          : cart;
        return (
          <CheckoutScreen
            items={items}
            onBack={() =>
              screen.buyNow
                ? setScreen({ type: "product", item: screen.buyNow })
                : goMain("cart")
            }
            onComplete={() => setScreen({ type: "checkout-success" })}
          />
        );
      }
      case "profile-page":
        return (
          <SimplePage
            title={screen.title}
            user={user}
            myListings={myListings}
            savedProducts={savedProducts}
            historyProducts={historyProducts}
            onProduct={openProduct}
            onDeleteListings={deleteListings}
            onOpenPage={(title) => setScreen({ type: "profile-page", title })}
            onBack={() => goMain("profile")}
          />
        );
      case "edit-profile":
        return (
          <EditProfile
            user={user}
            onBack={() => goMain("profile")}
            onSave={async (next) => {
              try {
                const data = await api("/api/profile", "PUT", next);
                setUser({ ...next, ...data.user.profile });
                goMain("profile");
              } catch (error) { alert((error as Error).message); }
            }}
          />
        );
      case "post-success":
        return (
          <Success
            title="Listed!"
            text="Your item is now live on Hive."
            onDone={() => goMain("home")}
          />
        );
      case "checkout-success":
        return (
          <Success
            title="Congratulations!"
            text="Your order is placed. The seller has been notified."
            onDone={() => {
              saveCart([]);
              goMain("home");
            }}
          />
        );
      case "main":
        break;
    }
    if (active === "home")
      return (
        <HomeScreen
          user={user}
          items={allListings}
          savedIds={savedIds}
          onToggleSaved={toggleSaved}
          onSearch={() => setScreen({ type: "search" })}
          onProduct={openProduct}
        />
      );
    if (active === "cart")
      return (
        <CartScreen
          cart={cart}
          onQty={(id, d) =>
            saveCart(
              cart.map((c) =>
                c.product.id === id ? { ...c, qty: Math.max(1, c.qty + d) } : c,
              ),
            )
          }
          onRemove={(id) => saveCart(cart.filter((c) => c.product.id !== id))}
          onCheckout={() => setScreen({ type: "checkout" })}
        />
      );
    if (active === "messages")
      return <MessagesList onOpen={(dm) => setScreen({ type: "chat", dm })} />;
    if (active === "profile")
      return (
        <OwnProfile
          user={user}
          activity={{
            saved: savedIds.length,
            viewed: historyIds.length,
            following: followingIds.length,
            coupons: coupons.length,
          }}
          onEdit={() => setScreen({ type: "edit-profile" })}
          onOpen={(title) => setScreen({ type: "profile-page", title })}
          onSignOut={() => setScreen({ type: "auth", mode: "login" })}
        />
      );
    return null;
  };
  const nav = screen.type === "main" || screen.type === "post";
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F3F2EE]">
      <div
        className="phone-shell ui-refresh relative overflow-hidden shadow-2xl bg-white"
        style={{
          width: 390,
          height: 844,
          borderRadius: 50,
          border: "6px solid #1A1A1A",
        }}
      >
        <div className="device-notch absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 rounded-b-3xl z-40 bg-[#1A1A1A]" />
        <div className="absolute inset-0 overflow-hidden">{content()}</div>
        {nav && (
          <BottomNav
            active={screen.type === "post" ? "post" : active}
            cartCount={cart.length}
            messageCount={messageUnread}
            onSelect={(t) => {
              if (t === "post") setScreen({ type: "post" });
              else goMain(t);
            }}
          />
        )}
      </div>
    </div>
  );
}

function Success({
  title,
  text,
  onDone,
}: {
  title: string;
  text: string;
  onDone: () => void;
}) {
  return (
    <div className="h-full bg-white flex flex-col items-center justify-center text-center px-9">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center"
        style={{ background: Y }}
      >
        <Check size={36} />
      </div>
      <h1 className="text-2xl font-bold mt-5">{title}</h1>
      <p className="text-sm text-gray-400 mt-2">{text}</p>
      <button
        onClick={onDone}
        className="pressable mt-8 px-10 h-12 rounded-2xl font-bold"
        style={{ background: Y }}
      >
        Done
      </button>
    </div>
  );
}
