import nodemailer from 'nodemailer';
import { FROM_EMAIL } from '$env/static/private';
//import { z } from "zod";
export default async function sendEmail(
	email: string,
	subject: string,
	bodyHtml?: string,
	bodyText?: string
) {
	// const hasAccessKeys = AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY;

	// const ses = new aws.SES({
	// 	apiVersion: AWS_API_VERSION,
	// 	region: AWS_REGION,
	// 	...(hasAccessKeys
	// 		? {
	// 				credentials: {
	// 					accessKeyId: AWS_ACCESS_KEY_ID || '',
	// 					secretAccessKey: AWS_SECRET_ACCESS_KEY || ''
	// 				}
	// 			}
	// 		: {})
	// });

	// create Nodemailer SES transporter
	// const transporter = nodemailer.createTransport({
	// 	SES: { ses, aws }
	// });

	// Dev SMTP Mock Server

	const devSMPTSettings = {
		host: 'sandbox.smtp.mailtrap.io',
		port: 2525,
		auth: {
			user: 'b43aac2777b9e1',
			pass: '46f23bd89883f8'
		}
	};

	// TODO: Set up prod mail settings with Nodemailer

	// Set up nodemailer transport
	const transporter = nodemailer.createTransport(devSMPTSettings);
	console.log({ transporter });

	try {
		if (!bodyText) {
			transporter.sendMail(
				{
					from: FROM_EMAIL,
					to: email,
					subject: subject,
					html: bodyHtml
				},
				(err) => {
					if (err) {
						throw new Error(`Error sending email: ${JSON.stringify(err)}`);
					}
				}
			);
		} else if (!bodyHtml) {
			transporter.sendMail(
				{
					from: FROM_EMAIL,
					to: email,
					subject: subject,
					text: bodyText
				},
				(err) => {
					if (err) {
						throw new Error(`Error sending email: ${JSON.stringify(err)}`);
					}
				}
			);
		} else {
			transporter.sendMail(
				{
					from: FROM_EMAIL,
					to: email,
					subject: subject,
					html: bodyHtml,
					text: bodyText
				},
				(err) => {
					if (err) {
						throw new Error(`Error sending email: ${JSON.stringify(err)}`);
					}
				}
			);
		}
		console.log('E-mail sent successfully!');
		return {
			statusCode: 200,
			message: 'E-mail sent successfully.'
		};
	} catch (error) {
		throw new Error(`Error sending email: ${JSON.stringify(error)}`);
	}
}
