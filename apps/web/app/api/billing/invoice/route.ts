export async function GET() {
  const content = `Invoice\nPlan: Pro Developer Plan\nAmount: 4820.00 INR\nDate: ${new Date().toISOString()}\n(This is a placeholder invoice. Replace with PDF generation.)`;
  return new Response(content, {
    headers: {
      "Content-Type": "text/plain",
      "Content-Disposition": `attachment; filename=invoice-${new Date().toISOString().slice(0, 7)}.txt`,
    },
  });
}
