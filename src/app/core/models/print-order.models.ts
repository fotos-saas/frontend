/**
 * Nyomda megrendelés modellek
 *
 * Közös típusok a fotós és nyomdász oldal közötti kommunikációhoz.
 */

export interface PrintShopMessage {
  id: number;
  userId: number;
  userName: string;
  message: string;
  type: 'message' | 'deadline_proposed' | 'deadline_accepted' | 'deadline_rejected' | 'reprint_request' | 'urgent_flag' | 'system';
  metadata: Record<string, unknown> | null;
  createdAt: string;
  isOwn: boolean;
}

export interface SendToPrintPayload {
  print_copies: number;
  print_deadline: string | null;
  is_urgent: boolean;
  message: string | null;
}

export interface RequestReprintPayload {
  message: string;
  print_copies?: number;
  print_deadline?: string | null;
  is_urgent?: boolean;
}

export interface DeadlineResponsePayload {
  action: 'accept' | 'modify';
  proposed_date?: string;
  message?: string;
}
