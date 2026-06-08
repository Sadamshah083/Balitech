import {
  Bell,
  Briefcase,
  Car,
  FileText,
  HeartPulse,
  Home,
  Landmark,
  Shield,
  Sun,
  Phone,
  Headphones,
  Users,
  Target,
  TrendingUp,
  Clock,
  Globe,
  Zap,
  type LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  bell: Bell,
  briefcase: Briefcase,
  car: Car,
  "file-text": FileText,
  "heart-pulse": HeartPulse,
  home: Home,
  landmark: Landmark,
  shield: Shield,
  sun: Sun,
  phone: Phone,
  headphones: Headphones,
  users: Users,
  target: Target,
  "trending-up": TrendingUp,
  clock: Clock,
  globe: Globe,
  zap: Zap,
};

export function getCampaignIcon(name: string): LucideIcon {
  return iconMap[name] ?? Briefcase;
}

export const campaignIconOptions = Object.keys(iconMap);
