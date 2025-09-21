import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Terms of Service</CardTitle>
            <p className="text-muted-foreground">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-3">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground">
                By accessing and using this tweet scheduling service ("Service"), you accept and agree 
                to be bound by the terms and provision of this agreement. If you do not agree to abide 
                by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">2. Description of Service</h2>
              <p className="text-muted-foreground">
                Our Service provides a platform for scheduling and managing tweets on social media 
                platforms. The Service allows users to create, schedule, and manage their social media 
                content through our web application.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">3. User Accounts</h2>
              <p className="text-muted-foreground mb-4">
                To use our Service, you must create an account. You are responsible for:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Providing accurate and complete information</li>
                <li>Maintaining the security of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of any unauthorized use</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">4. Acceptable Use</h2>
              <p className="text-muted-foreground mb-4">
                You agree to use the Service only for lawful purposes and in accordance with these Terms. 
                You agree not to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Post content that is illegal, harmful, or violates any laws</li>
                <li>Post spam, malicious content, or unsolicited communications</li>
                <li>Impersonate others or provide false information</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Use the Service to harass, abuse, or harm others</li>
                <li>Violate any applicable social media platform terms of service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">5. Content and Intellectual Property</h2>
              <p className="text-muted-foreground mb-4">
                You retain ownership of all content you create and post through our Service. However, 
                by using our Service, you grant us a limited license to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Process and transmit your content to social media platforms</li>
                <li>Store your content for scheduling purposes</li>
                <li>Provide technical support and service improvements</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">6. Service Availability</h2>
              <p className="text-muted-foreground">
                We strive to provide reliable service but cannot guarantee uninterrupted access. 
                We reserve the right to modify, suspend, or discontinue the Service at any time 
                with or without notice.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">7. Limitation of Liability</h2>
              <p className="text-muted-foreground">
                To the maximum extent permitted by law, we shall not be liable for any indirect, 
                incidental, special, consequential, or punitive damages, including without limitation, 
                loss of profits, data, use, goodwill, or other intangible losses resulting from your 
                use of the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">8. Indemnification</h2>
              <p className="text-muted-foreground">
                You agree to defend, indemnify, and hold harmless our company and its affiliates 
                from any claims, damages, or expenses arising from your use of the Service or 
                violation of these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">9. Termination</h2>
              <p className="text-muted-foreground">
                We may terminate or suspend your account and access to the Service immediately, 
                without prior notice, for any reason, including if you breach these Terms. 
                You may also terminate your account at any time.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">10. Changes to Terms</h2>
              <p className="text-muted-foreground">
                We reserve the right to modify these Terms at any time. We will notify users of 
                any material changes by posting the new Terms on this page and updating the 
                "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">11. Governing Law</h2>
              <p className="text-muted-foreground">
                These Terms shall be governed by and construed in accordance with applicable laws, 
                without regard to conflict of law principles.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">12. Contact Information</h2>
              <p className="text-muted-foreground">
                If you have any questions about these Terms of Service, please contact us at: 
                <a href="mailto:legal@tweetscheduler.com" className="text-primary hover:underline">
                  legal@tweetscheduler.com
                </a>
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
