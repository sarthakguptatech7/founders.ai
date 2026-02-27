import { NextRequest, NextResponse } from 'next/server';
import { waStore } from '@/lib/engine/whatsapp/whatsapp-store';

// GET — list contacts (optional ?tag=VIP filter)
export async function GET(request: NextRequest) {
    const tag = request.nextUrl.searchParams.get('tag') || undefined;
    const contacts = waStore.getContacts(tag);
    return NextResponse.json({ contacts, total: contacts.length });
}

// POST — add contact(s)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Bulk import
        if (body.bulk && Array.isArray(body.contacts)) {
            const added = waStore.addContactsBulk(body.contacts);
            return NextResponse.json({ contacts: added, count: added.length });
        }

        // Single
        const { name, phone, tags } = body;
        if (!name || !phone) {
            return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 });
        }

        const contact = waStore.addContact({
            name, phone, tags: tags || [], optedIn: true,
        });
        return NextResponse.json({ contact });
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}

// DELETE — remove contact
export async function DELETE(request: NextRequest) {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Contact ID required' }, { status: 400 });
    const deleted = waStore.deleteContact(id);
    return NextResponse.json({ deleted });
}
