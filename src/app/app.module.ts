import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// Core interceptors
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { ErrorInterceptor } from './core/interceptors/error.interceptor';

// Standalone komponensek amik az AppComponent-ben kellenek
import { ToastComponent } from './shared/components/toast/toast.component';
import { TopLoadingBarComponent } from './shared/components/top-loading-bar/top-loading-bar.component';

// Lucide ikonok globális konfigurálása
import {
  LucideAngularModule,
  Home,
  Image,
  ShoppingCart,
  Newspaper,
  MessageCircle,
  Settings,
  Bell,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  LayoutDashboard,
  FolderOpen,
  Folder,
  GraduationCap,
  LogOut,
  QrCode,
  Search,
  School,
  Plus,
  Copy,
  Check,
  RefreshCw,
  Printer,
  Ban,
  // Marketer modul ikonok
  History,
  Phone,
  MapPin,
  Mail,
  Smartphone,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  XCircle,
  Pencil,
  Trash2,
  // Partner modul ikonok
  Users,
  User,
  UserRoundSearch,
  UserCheck,
  UserX,
  UserPlus,
  Calendar,
  Clock,
  Building,
  Building2,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  FolderPlus,
  Expand,
  Filter,
  // Státusz ikonok
  Circle,
  FileCheck,
  Camera,
  MailCheck,
  Forward,
  // Photo upload wizard ikonok
  Upload,
  Info,
  Download,
  ExternalLink,
  // Draft picker ikonok
  Play,
  // Step review filter ikonok
  Briefcase,
  // Step choice ikonok (AI vs Manuális párosítás)
  Wand2,
  Hand,
  Sparkles,
  MousePointer2,
  // Lightbox ikonok
  ZoomIn,
  ZoomOut,
  // Partner Orders ikonok
  ShoppingBag,
  Key,
  Grid3x3,
  Frame,
  Sparkle,
  // Client modul ikonok
  Images,
  Save,
  // Lista nézet ikonok
  List,
  FileSpreadsheet,
  // Payment & Billing
  CreditCard,
  Package,
  Wallet,
  Percent,
  // Subscription & Settings
  HardDrive,
  PauseCircle,
  PlayCircle,
  FileText,
  // Audit log toggle
  Eye
} from 'lucide-angular';

/**
 * Lucide ikonok - globálisan regisztrálva az egész appban
 * Új ikon hozzáadásához:
 * 1. Import hozzáadása fent
 * 2. Hozzáadás az ICONS objektumhoz
 */
const LUCIDE_ICONS = {
  Home,
  Image,
  ShoppingCart,
  Newspaper,
  MessageCircle,
  Settings,
  Bell,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  LayoutDashboard,
  FolderOpen,
  Folder,
  GraduationCap,
  LogOut,
  QrCode,
  Search,
  School,
  Plus,
  Copy,
  Check,
  RefreshCw,
  Printer,
  Ban,
  // Marketer modul ikonok
  History,
  Phone,
  MapPin,
  Mail,
  Smartphone,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  XCircle,
  Pencil,
  Trash2,
  // Partner modul ikonok
  Users,
  User,
  UserRoundSearch,
  UserCheck,
  UserX,
  UserPlus,
  Calendar,
  Clock,
  Building,
  Building2,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  FolderPlus,
  Expand,
  Filter,
  // Státusz ikonok
  Circle,
  FileCheck,
  Camera,
  MailCheck,
  Forward,
  // Photo upload wizard ikonok
  Upload,
  Info,
  Download,
  ExternalLink,
  // Draft picker ikonok
  Play,
  // Step review filter ikonok
  Briefcase,
  // Step choice ikonok (AI vs Manuális párosítás)
  Wand2,
  Hand,
  Sparkles,
  MousePointer2,
  // Lightbox ikonok
  ZoomIn,
  ZoomOut,
  // Partner Orders ikonok
  ShoppingBag,
  Key,
  Grid3x3,
  Frame,
  Sparkle,
  // Client modul ikonok
  Images,
  Save,
  // Lista nézet ikonok
  List,
  FileSpreadsheet,
  // Payment & Billing
  CreditCard,
  Package,
  Wallet,
  Percent,
  // Subscription & Settings
  HardDrive,
  PauseCircle,
  PlayCircle,
  FileText,
  // Audit log toggle
  Eye
};

@NgModule({
    declarations: [
        AppComponent
        // Minden más komponens standalone és lazy-loaded
    ],
    bootstrap: [AppComponent],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        AppRoutingModule,
        // Toast az AppComponent-ben van használva
        ToastComponent,
        // Top Loading Bar - navigáció közben jelenik meg
        TopLoadingBarComponent,
        // Lucide ikonok globálisan
        LucideAngularModule.pick(LUCIDE_ICONS)
    ],
    providers: [
        // Minden service providedIn: 'root' használ - csak az interceptorok kellenek itt!
        // FONTOS: A sorrend számít! AuthInterceptor előbb fut (token hozzáadás),
        // ErrorInterceptor utána (hibakezelés)
        {
            provide: HTTP_INTERCEPTORS,
            useClass: AuthInterceptor,
            multi: true
        },
        {
            provide: HTTP_INTERCEPTORS,
            useClass: ErrorInterceptor,
            multi: true
        },
        provideHttpClient(withInterceptorsFromDi())
    ]
})
export class AppModule { }
