import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async () => {
	// Return minimal HTML that just auto-closes
	return new Response(
		`<!DOCTYPE html>
		<html>
		<head>
			<title>Complete</title>
			<meta charset="utf-8">
		</head>
		<body style="margin:0;padding:0;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:system-ui;background:#f9fafb">
			<script>
				// Try to close window immediately
				window.close();
			</script>
			<p style="color:#6b7280;text-align:center">You can close this window</p>
		</body>
		</html>`,
		{
			headers: {
				'Content-Type': 'text/html'
			}
		}
	);
};
