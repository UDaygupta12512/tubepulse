import { NextResponse } from "next/server";
import { createUser } from "@/lib/user-store";

interface RegisterBody {
    name?: string;
    email?: string;
    password?: string;
}

function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: Request) {
    let body: RegisterBody;

    try {
        body = (await req.json()) as RegisterBody;
    } catch {
        return NextResponse.json({ message: "Invalid JSON payload." }, { status: 400 });
    }

    const name = body.name?.trim() ?? "";
    const email = body.email?.trim() ?? "";
    const password = body.password ?? "";

    if (!name) {
        return NextResponse.json({ message: "Name is required." }, { status: 400 });
    }

    if (!isValidEmail(email)) {
        return NextResponse.json({ message: "Valid email is required." }, { status: 400 });
    }

    if (password.length < 8) {
        return NextResponse.json({ message: "Password must be at least 8 characters." }, { status: 400 });
    }

    try {
        await createUser({ name, email, password });
        return NextResponse.json({ message: "Account created successfully." }, { status: 201 });
    } catch (error) {
        if (error instanceof Error && error.message === "EMAIL_EXISTS") {
            return NextResponse.json({ message: "An account with this email already exists." }, { status: 409 });
        }

        return NextResponse.json({ message: "Unable to create account right now." }, { status: 500 });
    }
}
