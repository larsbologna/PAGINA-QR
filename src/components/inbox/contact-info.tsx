import { Mail, MessageCircle, Phone, User } from "lucide-react";

/** Datos de contacto que el cliente dejó voluntariamente (con consentimiento). */
export function ContactInfo({ contact }: { contact: { name: string | null; phone: string | null; email: string | null } }) {
  const digits = contact.phone?.replace(/\D/g, "") ?? "";
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-900">
      <span className="text-xs font-semibold">Pidió que lo contacten:</span>
      {contact.name && (
        <span className="inline-flex items-center gap-1">
          <User className="size-3.5" aria-hidden /> {contact.name}
        </span>
      )}
      {contact.phone && (
        <>
          <a href={`tel:${digits}`} className="inline-flex items-center gap-1 underline">
            <Phone className="size-3.5" aria-hidden /> {contact.phone}
          </a>
          {digits.length >= 8 && (
            <a href={`https://wa.me/${digits}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline">
              <MessageCircle className="size-3.5" aria-hidden /> WhatsApp
            </a>
          )}
        </>
      )}
      {contact.email && (
        <a href={`mailto:${contact.email}`} className="inline-flex items-center gap-1 underline">
          <Mail className="size-3.5" aria-hidden /> {contact.email}
        </a>
      )}
    </div>
  );
}
