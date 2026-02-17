interface RecommendationCardProps {
  index: number;
  text: string;
}

export default function RecommendationCard({ index, text }: RecommendationCardProps) {
  return (
    <div className="bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3039] rounded-xl p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-9 h-9 rounded-lg bg-teal-600 flex items-center justify-center text-white font-semibold text-sm">
            {index}
          </div>
        </div>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{text}</p>
      </div>
    </div>
  );
}
