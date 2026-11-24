import { notFound } from "next/navigation";

// Any /ru/… URL without its own route gets the site's 404 page (with header and footer) and status 404.
export default function CatchAll() {
  notFound();
}
