'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';

interface StewardshipHowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function StewardshipHowItWorksModal({
  isOpen,
  onClose,
}: StewardshipHowItWorksModalProps) {
  const sectionIds = ['1', '2', '3', '4', '5', '6'];
  const [expanded, setExpanded] = useState<string[]>(['1']);

  useEffect(() => {
    if (isOpen) {
      setExpanded(['1']); // open first section
    } else {
      setExpanded([]);
    }
  }, [isOpen]);

  const toggleExpand = (id: string) => {
    setExpanded(prev =>
      prev.includes(id)
        ? prev.filter(v => v !== id)
        : [...prev, id]
    );
  };

  const expandAll = () => setExpanded(sectionIds);
  const collapseAll = () => setExpanded([]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900">
        <DialogHeader>
          <DialogTitle className="text-2xl md:text-3xl font-display font-bold text-midnight-navy dark:text-gray-100">
            How Stewardship Works
          </DialogTitle>
        </DialogHeader>

        {/* Expand / Collapse Controls */}
        <div className="flex gap-3 mb-4 pb-4 border-b border-frost-gray dark:border-gray-700">
          <button
            onClick={expandAll}
            className="text-sm text-crimson hover:text-crimson/80 font-medium transition"
          >
            Expand All
          </button>
          <span className="text-midnight-navy/40 dark:text-gray-600">|</span>
          <button
            onClick={collapseAll}
            className="text-sm text-crimson hover:text-crimson/80 font-medium transition"
          >
            Collapse All
          </button>
        </div>

        {/* Accordion */}
        <Accordion
          type="multiple"
          value={expanded}
          onValueChange={setExpanded}
          className="space-y-3"
        >
          {/* Section 1 */}
          <AccordionItem value="1" className="border rounded-lg">
            <AccordionTrigger className="px-4 py-3 text-left">
              1. Only verified Brothers can become Stewards
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 text-midnight-navy/70 dark:text-gray-300">
              To preserve authenticity and trust, Steward listings are exclusive
              to verified 1Kappa members.
            </AccordionContent>
          </AccordionItem>

          {/* Section 2 */}
          <AccordionItem value="2" className="border rounded-lg">
            <AccordionTrigger className="px-4 py-3 text-left">
              2. Stewards pass on meaningful fraternity items
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 text-midnight-navy/70 dark:text-gray-300">
              <p className="mb-3">
                These include:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Cardigans</li>
                <li>Blazers</li>
                <li>Chapter jackets</li>
                <li>Books or line journals</li>
                <li>Pins and plaques</li>
                <li>Keepsakes and legacy items</li>
                <li>Collectible or ceremonial pieces</li>
              </ul>
              <p className="mt-3">
                Items must be in good condition and have fraternity relevance.
              </p>
            </AccordionContent>
          </AccordionItem>

          {/* Section 3 */}
          <AccordionItem value="3" className="border rounded-lg">
            <AccordionTrigger className="px-4 py-3 text-left">
              3. Steward items are free — with a purpose
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 text-midnight-navy/70 dark:text-gray-300">
              <p className="mb-3">Claiming a Steward item requires:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Shipping cost</li>
                <li>A small platform fee</li>
                <li>An undergraduate chapter donation</li>
              </ul>
              <p className="mt-3">
                This ensures the exchange is meaningful and mission-driven.
              </p>
            </AccordionContent>
          </AccordionItem>

          {/* Section 4 */}
          <AccordionItem value="4" className="border rounded-lg">
            <AccordionTrigger className="px-4 py-3 text-left">
              4. Each listing directly supports a chapter
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 text-midnight-navy/70 dark:text-gray-300">
              <p className="mb-3">
                Every Steward designates one undergraduate chapter to support.
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Scholarships</li>
                <li>Chapter programming</li>
                <li>Service initiatives</li>
                <li>Leadership development</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          {/* Section 5 */}
          <AccordionItem value="5" className="border rounded-lg">
            <AccordionTrigger className="px-4 py-3 text-left">
              5. Stewards can also be Sellers or Promoters
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 text-midnight-navy/70 dark:text-gray-300">
              <p>
                Brothers can participate in multiple roles and choose separate
                sponsoring chapters for:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-3">
                <li>Steward listings</li>
                <li>Seller listings</li>
                <li>Promoter events</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          {/* Section 6 */}
          <AccordionItem value="6" className="border rounded-lg">
            <AccordionTrigger className="px-4 py-3 text-left">
              6. Stewardship is about legacy
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 text-midnight-navy/70 dark:text-gray-300">
              Stewards honor the Bond by ensuring cherished items continue their
              journey with another Brother—while supporting those carrying the
              torch today.
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Footer */}
        <div className="mt-8 flex justify-end">
          <Button
            onClick={onClose}
            className="bg-crimson text-white hover:bg-crimson/90 shadow-md"
          >
            Got it
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}