import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, FileText } from 'lucide-react';

interface PDFDetailsPanelProps {
  fileName: string;
}

export default function PDFDetailsPanel({ fileName }: PDFDetailsPanelProps) {
  const details = [
    { label: 'Ministry', value: 'Ministry of Health & Family Welfare' },
    { label: 'Division', value: 'Health Services Division' },
    { label: 'Procuring Entity Name', value: 'Directorate General of Health Services (DGHS)' },
    { label: 'Procuring Entity District', value: 'Dhaka' },
    { label: 'Procuring Entity Upazila/Thana', value: 'Tejgaon' },
    { label: 'E-GP Ref No.', value: 'DGHS/Procurement/2024/IFT/11234' },
    { label: 'Tender ID', value: 'TN-2024-DGHS-11234' },
    { label: 'Source of Fund', value: 'GoB (Government of Bangladesh)' },
  ];

  const scheduleItems = [
    { event: 'Publishing Date', date: '15-Nov-2024' },
    { event: 'Document Sale Start Date', date: '16-Nov-2024, 10:00 AM' },
    { event: 'Document Sale End Date', date: '30-Nov-2024, 05:00 PM' },
    { event: 'Pre-Tender Meeting Date', date: '22-Nov-2024, 11:00 AM' },
    { event: 'Last Date & Time of Tender Submission', date: '01-Dec-2024, 02:00 PM' },
    { event: 'Tender Opening Date', date: '01-Dec-2024, 03:00 PM' },
  ];

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200 overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              View IFT / PO / REOI / RFP / PSN Notice Details
            </h2>
          </div>

          <div className="space-y-3 mb-6">
            {details.map((detail, index) => (
              <div
                key={index}
                className="grid grid-cols-[140px,1fr] gap-3 text-sm"
              >
                <div className="text-gray-600 font-medium">{detail.label}:</div>
                <div className="text-gray-900">{detail.value}</div>
              </div>
            ))}
          </div>

          <div className="mb-6">
            <div className="bg-green-50 border-l-4 border-green-500 px-4 py-3 mb-3">
              <h3 className="font-semibold text-gray-900 text-sm">
                Key Information and Funding Information
              </h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-[140px,1fr] gap-3">
                <div className="text-gray-600 font-medium">Tender Type:</div>
                <div className="text-gray-900">International Tender (IFT)</div>
              </div>
              <div className="grid grid-cols-[140px,1fr] gap-3">
                <div className="text-gray-600 font-medium">Contract Type:</div>
                <div className="text-gray-900">Framework Contract</div>
              </div>
              <div className="grid grid-cols-[140px,1fr] gap-3">
                <div className="text-gray-600 font-medium">Budget:</div>
                <div className="text-gray-900">BDT 450,000,000.00</div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <div className="bg-green-50 border-l-4 border-green-500 px-4 py-3 mb-3">
              <h3 className="font-semibold text-gray-900 text-sm">
                Particular Information
              </h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-[140px,1fr] gap-3">
                <div className="text-gray-600 font-medium">Category:</div>
                <div className="text-gray-900">Medical Equipment & Supplies</div>
              </div>
              <div className="grid grid-cols-[140px,1fr] gap-3">
                <div className="text-gray-600 font-medium">Description:</div>
                <div className="text-gray-900 leading-relaxed">
                  Procurement of advanced medical diagnostic equipment including MRI machines, CT scanners,
                  ultrasound systems, and related accessories for distribution to tertiary hospitals across
                  Bangladesh. The equipment must meet international quality standards (ISO 13485, CE, FDA approved)
                  and include comprehensive warranty, training, and maintenance support for a minimum period of 5 years.
                </div>
              </div>
              <div className="grid grid-cols-[140px,1fr] gap-3">
                <div className="text-gray-600 font-medium">Tender Fee:</div>
                <div className="text-gray-900">BDT 50,000.00 (Non-refundable)</div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">Schedule</h3>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-semibold text-gray-700 border-b border-gray-200">
                      Event
                    </th>
                    <th className="px-4 py-2.5 text-left font-semibold text-gray-700 border-b border-gray-200">
                      Date & Time
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {scheduleItems.map((item, index) => (
                    <tr key={index} className="border-b border-gray-100 last:border-b-0">
                      <td className="px-4 py-2.5 text-gray-900">{item.event}</td>
                      <td className="px-4 py-2.5 text-gray-700">{item.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mb-4">
            <div className="bg-yellow-50 border-l-4 border-yellow-500 px-4 py-3">
              <p className="text-sm text-gray-900">
                <span className="font-semibold">Important:</span> All bidders must be registered on the
                e-GP portal and possess valid certificates. Joint venture proposals are accepted with
                prior approval.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 px-6 py-3 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button className="p-1.5 hover:bg-gray-200 rounded transition-colors">
              <ChevronLeft size={18} className="text-gray-600" />
            </button>
            <span className="text-sm text-gray-700 font-medium">1 of 2</span>
            <button className="p-1.5 hover:bg-gray-200 rounded transition-colors">
              <ChevronRight size={18} className="text-gray-600" />
            </button>
          </div>
          <div className="flex items-center gap-1">
            <button className="p-1.5 hover:bg-gray-200 rounded transition-colors">
              <ZoomOut size={18} className="text-gray-600" />
            </button>
            <button className="p-1.5 hover:bg-gray-200 rounded transition-colors">
              <ZoomIn size={18} className="text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
