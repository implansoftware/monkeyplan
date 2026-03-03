import { storage } from "../storage";
import {
  sendEmail,
  emailRepairCreated,
  emailRepairStatusChanged,
  emailQuoteIssued,
  emailReadyForPickup,
  emailRepairDelivered,
  emailInvoiceCreated,
  emailTicketCreated,
  emailTicketReply,
  emailTicketClosed,
  emailWelcome,
  emailB2BOrderCreated,
  emailB2BOrderShipped,
  emailWarrantyActivated,
  emailDeliveryAppointment,
  emailStandaloneQuote,
  emailRemoteRepairRequestCreated,
  type RepairEmailData,
  type InvoiceEmailData,
  type TicketEmailData,
  type UserEmailData,
  type B2BOrderEmailData,
  type WarrantyEmailData,
  type DeliveryAppointmentEmailData,
  type StandaloneQuoteEmailData,
  type RemoteRepairRequestEmailData,
} from "./email";

async function getUserEmail(userId: string): Promise<{ email: string; fullName: string } | null> {
  try {
    const user = await storage.getUser(userId);
    if (!user || !user.email) return null;
    return { email: user.email, fullName: user.fullName || user.username };
  } catch {
    return null;
  }
}

export async function notifyRepairCreated(repairOrder: any): Promise<void> {
  try {
    if (!repairOrder.customerId) return;
    const customer = await getUserEmail(repairOrder.customerId);
    if (!customer) return;

    const data: RepairEmailData = {
      repairCode: repairOrder.repairCode || repairOrder.id,
      customerName: customer.fullName,
      customerEmail: customer.email,
      deviceType: repairOrder.deviceType,
      brand: repairOrder.brand,
      model: repairOrder.model,
      serialNumber: repairOrder.serialNumber || repairOrder.imei,
      issueDescription: repairOrder.issueDescription,
      status: repairOrder.status || "pending",
    };

    const { subject, html } = emailRepairCreated(data);
    await sendEmail({ to: customer.email, subject, html });
  } catch (error) {
    console.error("[EmailNotify] Failed to send repair created email:", error);
  }
}

export async function notifyRepairStatusChanged(repairOrder: any, oldStatus: string): Promise<void> {
  try {
    if (!repairOrder.customerId) return;
    if (repairOrder.status === oldStatus) return;
    const customer = await getUserEmail(repairOrder.customerId);
    if (!customer) return;

    const data: RepairEmailData = {
      repairCode: repairOrder.repairCode || repairOrder.id,
      customerName: customer.fullName,
      customerEmail: customer.email,
      deviceType: repairOrder.deviceType,
      brand: repairOrder.brand,
      model: repairOrder.model,
      status: repairOrder.status,
      estimatedCost: repairOrder.estimatedCost,
      finalCost: repairOrder.finalCost,
      notes: repairOrder.notes,
    };

    if (repairOrder.status === "pronto_ritiro") {
      const { subject, html } = emailReadyForPickup(data);
      await sendEmail({ to: customer.email, subject, html });
    } else if (repairOrder.status === "consegnato") {
      const { subject, html } = emailRepairDelivered(data);
      await sendEmail({ to: customer.email, subject, html });
    } else {
      const { subject, html } = emailRepairStatusChanged(data, oldStatus);
      await sendEmail({ to: customer.email, subject, html });
    }
  } catch (error) {
    console.error("[EmailNotify] Failed to send repair status email:", error);
  }
}

export async function notifyQuoteIssued(repairOrder: any, quoteItems?: any[]): Promise<void> {
  try {
    if (!repairOrder.customerId) return;
    const customer = await getUserEmail(repairOrder.customerId);
    if (!customer) return;

    const data: RepairEmailData = {
      repairCode: repairOrder.repairCode || repairOrder.id,
      customerName: customer.fullName,
      customerEmail: customer.email,
      brand: repairOrder.brand,
      model: repairOrder.model,
      status: "preventivo_emesso",
      estimatedCost: repairOrder.estimatedCost,
    };

    const items = quoteItems?.map(i => ({
      description: i.description || i.serviceName || "Servizio",
      quantity: i.quantity || 1,
      unitPrice: parseFloat(i.unitPrice || i.price || "0"),
    }));

    const { subject, html } = emailQuoteIssued(data, items);
    await sendEmail({ to: customer.email, subject, html });
  } catch (error) {
    console.error("[EmailNotify] Failed to send quote email:", error);
  }
}

export async function notifyInvoiceCreated(invoice: any): Promise<void> {
  try {
    if (!invoice.customerId) return;
    const customer = await getUserEmail(invoice.customerId);
    if (!customer) return;

    const data: InvoiceEmailData = {
      invoiceNumber: invoice.invoiceNumber || invoice.id,
      customerName: customer.fullName,
      customerEmail: customer.email,
      amount: parseFloat(invoice.amount || "0"),
      tax: invoice.tax ? parseFloat(invoice.tax) : undefined,
      totalAmount: parseFloat(invoice.totalAmount || invoice.amount || "0"),
      issueDate: invoice.issueDate || invoice.createdAt,
      dueDate: invoice.dueDate,
      repairCode: invoice.repairCode,
      status: invoice.status,
    };

    const { subject, html } = emailInvoiceCreated(data);
    await sendEmail({ to: customer.email, subject, html });
  } catch (error) {
    console.error("[EmailNotify] Failed to send invoice email:", error);
  }
}

export async function notifyTicketCreated(ticket: any): Promise<void> {
  try {
    if (!ticket.customerId) return;
    const customer = await getUserEmail(ticket.customerId);
    if (!customer) return;

    const data: TicketEmailData = {
      ticketCode: ticket.ticketNumber || ticket.id,
      customerName: customer.fullName,
      customerEmail: customer.email,
      subject: ticket.subject || "Richiesta di assistenza",
      message: ticket.description,
      priority: ticket.priority,
      category: ticket.category,
    };

    const { subject, html } = emailTicketCreated(data);
    await sendEmail({ to: customer.email, subject, html });
  } catch (error) {
    console.error("[EmailNotify] Failed to send ticket email:", error);
  }
}

export async function notifyTicketReply(ticket: any, replyMessage: string, replierId: string): Promise<void> {
  try {
    if (!ticket.customerId) return;
    const customer = await getUserEmail(ticket.customerId);
    if (!customer) return;
    const replier = await getUserEmail(replierId);
    const replierName = replier?.fullName || "Supporto";

    const recipientId = replierId === ticket.customerId ? null : ticket.customerId;
    if (!recipientId) return;
    const recipient = await getUserEmail(recipientId);
    if (!recipient) return;

    const data: TicketEmailData = {
      ticketCode: ticket.ticketNumber || ticket.id,
      customerName: recipient.fullName,
      customerEmail: recipient.email,
      subject: ticket.subject || "Richiesta di assistenza",
    };

    const { subject, html } = emailTicketReply(data, replyMessage, replierName);
    await sendEmail({ to: recipient.email, subject, html });
  } catch (error) {
    console.error("[EmailNotify] Failed to send ticket reply email:", error);
  }
}

export async function notifyTicketClosed(ticket: any): Promise<void> {
  try {
    if (!ticket.customerId) return;
    const customer = await getUserEmail(ticket.customerId);
    if (!customer) return;

    const data: TicketEmailData = {
      ticketCode: ticket.ticketNumber || ticket.id,
      customerName: customer.fullName,
      customerEmail: customer.email,
      subject: ticket.subject || "Richiesta di assistenza",
    };

    const { subject, html } = emailTicketClosed(data);
    await sendEmail({ to: customer.email, subject, html });
  } catch (error) {
    console.error("[EmailNotify] Failed to send ticket closed email:", error);
  }
}

export async function notifyUserCreated(user: any, plainPassword?: string): Promise<void> {
  try {
    if (!user.email) return;

    const data: UserEmailData = {
      fullName: user.fullName || user.username,
      email: user.email,
      username: user.username,
      password: plainPassword,
      role: user.role,
    };

    const { subject, html } = emailWelcome(data);
    await sendEmail({ to: user.email, subject, html });
  } catch (error) {
    console.error("[EmailNotify] Failed to send welcome email:", error);
  }
}

export async function notifyB2BOrderCreated(order: any, items?: any[]): Promise<void> {
  try {
    const buyer = order.resellerId ? await getUserEmail(order.resellerId) : null;

    const data: B2BOrderEmailData = {
      orderCode: order.orderNumber || order.id,
      buyerName: buyer?.fullName || "Acquirente",
      buyerEmail: buyer?.email || "",
      sellerName: "MonkeyPlan",
      totalAmount: parseFloat(order.totalAmount || "0"),
      status: order.status || "pending",
      items: items?.map(i => ({
        name: i.productName || i.name || "Prodotto",
        quantity: i.quantity || 1,
        price: parseFloat(i.unitPrice || i.price || "0"),
      })),
    };

    const { subject, html } = emailB2BOrderCreated(data);
    if (buyer?.email) {
      await sendEmail({ to: buyer.email, subject, html });
    }
  } catch (error) {
    console.error("[EmailNotify] Failed to send B2B order email:", error);
  }
}

export async function notifyB2BOrderShipped(order: any, trackingNumber?: string): Promise<void> {
  try {
    const buyerId = order.resellerId || order.repairCenterId;
    if (!buyerId) return;
    const buyer = await getUserEmail(buyerId);
    if (!buyer) return;

    const data: B2BOrderEmailData = {
      orderCode: order.orderNumber || order.id,
      buyerName: buyer.fullName,
      buyerEmail: buyer.email,
      sellerName: "MonkeyPlan",
      totalAmount: parseFloat(order.totalAmount || "0"),
      status: "shipped",
    };

    const { subject, html } = emailB2BOrderShipped(data, trackingNumber);
    await sendEmail({ to: buyer.email, subject, html });
  } catch (error) {
    console.error("[EmailNotify] Failed to send B2B shipped email:", error);
  }
}

export async function notifyWarrantyActivated(warranty: any): Promise<void> {
  try {
    if (!warranty.customerId) return;
    const customer = await getUserEmail(warranty.customerId);
    if (!customer) return;

    const data: WarrantyEmailData = {
      customerName: customer.fullName,
      customerEmail: customer.email,
      warrantyCode: warranty.warrantyCode || warranty.id,
      planName: warranty.planName || "Piano Garanzia",
      deviceInfo: warranty.deviceInfo || "Dispositivo",
      startDate: warranty.startDate,
      endDate: warranty.endDate,
      coverageDetails: warranty.coverageDetails,
    };

    const { subject, html } = emailWarrantyActivated(data);
    await sendEmail({ to: customer.email, subject, html });
  } catch (error) {
    console.error("[EmailNotify] Failed to send warranty email:", error);
  }
}

export async function notifyDeliveryAppointment(appointment: any, repairCode?: string): Promise<void> {
  try {
    if (!appointment.customerId) return;
    const customer = await getUserEmail(appointment.customerId);
    if (!customer) return;

    const data: DeliveryAppointmentEmailData = {
      customerName: customer.fullName,
      customerEmail: customer.email,
      appointmentDate: appointment.date + " " + (appointment.startTime || ""),
      repairCode,
      notes: appointment.notes,
    };

    const { subject, html } = emailDeliveryAppointment(data);
    await sendEmail({ to: customer.email, subject, html });
  } catch (error) {
    console.error("[EmailNotify] Failed to send appointment email:", error);
  }
}

export async function notifyStandaloneQuote(quote: any, items: any[]): Promise<void> {
  try {
    if (!quote.customerId) return;
    const customer = await getUserEmail(quote.customerId);
    if (!customer) return;

    const data: StandaloneQuoteEmailData = {
      quoteNumber: quote.quoteNumber || quote.id,
      customerName: customer.fullName,
      customerEmail: customer.email,
      totalAmount: parseFloat(quote.totalAmount || "0"),
      validUntil: quote.validUntil,
      items: items.map(i => ({
        description: i.description || i.serviceName || "Servizio",
        quantity: i.quantity || 1,
        unitPrice: parseFloat(i.unitPrice || "0"),
        total: parseFloat(i.total || i.lineTotal || "0"),
      })),
      notes: quote.notes,
    };

    const { subject, html } = emailStandaloneQuote(data);
    await sendEmail({ to: customer.email, subject, html });
  } catch (error) {
    console.error("[EmailNotify] Failed to send standalone quote email:", error);
  }
}

export async function notifyRemoteRepairRequestCreated(
  request: any,
  customer: { fullName?: string; username?: string },
  devices: any[]
): Promise<void> {
  try {
    if (!request.resellerId) return;
    const reseller = await getUserEmail(request.resellerId);
    if (!reseller) return;

    const data: RemoteRepairRequestEmailData = {
      resellerName: reseller.fullName,
      resellerEmail: reseller.email,
      customerName: customer.fullName || customer.username || "Cliente",
      requestNumber: request.requestNumber || request.id.slice(0, 8).toUpperCase(),
      deviceCount: devices.length,
      devices: devices.map((d) => ({
        deviceType: d.deviceType,
        brand: d.brand,
        model: d.model,
        issue: d.issue || d.issueDescription,
      })),
      notes: request.notes,
    };

    const { subject, html } = emailRemoteRepairRequestCreated(data);
    await sendEmail({ to: reseller.email, subject, html });
    console.log(`[EmailNotify] Remote repair request email sent to reseller ${reseller.email}`);
  } catch (error) {
    console.error("[EmailNotify] Failed to send remote repair request email:", error);
  }
}
