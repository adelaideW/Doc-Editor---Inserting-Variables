/** Static offer letter template for Lumina AI demo (replaces canvas on Generate). */
export function offerLetterDemoHtml(): string {
  return `
<p><strong>Offer of Employment</strong></p>
<p><br></p>
<p>Date: [Date]</p>
<p><br></p>
<p>Dear [Candidate Name],</p>
<p><br></p>
<p>We are pleased to offer you the position of <strong>[Job Title]</strong> at [Company Name]. This letter outlines the key terms of your employment, subject to the successful completion of any required background checks.</p>
<p><br></p>
<p><strong>Position and duties</strong></p>
<p>You will report to [Manager Name] and perform duties consistent with your role and our business needs.</p>
<p><br></p>
<p><strong>Compensation</strong></p>
<p>Your starting base salary will be <strong>[Annual Salary]</strong>, paid in accordance with our standard payroll schedule. You may also be eligible for [Bonus / Equity] as described in applicable plan documents.</p>
<p><br></p>
<p><strong>Start date</strong></p>
<p>Your anticipated start date is <strong>[Start Date]</strong>, or another date we agree upon in writing.</p>
<p><br></p>
<p><strong>Benefits</strong></p>
<p>You will be eligible to participate in company benefit programs in accordance with plan terms and eligibility requirements.</p>
<p><br></p>
<p>This offer is contingent upon your execution of our standard employment agreements and policies. Please sign below to accept this offer.</p>
<p><br></p>
<p>Sincerely,</p>
<p><br></p>
<p>[Hiring Manager Name]<br>[Title]<br>[Company Name]</p>
<p><br></p>
<p>Accepted by: _________________________ &nbsp; Date: __________</p>
`.trim();
}
