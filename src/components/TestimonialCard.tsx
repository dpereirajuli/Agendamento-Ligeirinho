import { Star } from 'lucide-react';
import { forwardRef } from 'react';

interface TestimonialCardProps {
  name: string;
  rating: number;
  comment: string;
  location?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const TestimonialCard = forwardRef<HTMLDivElement, TestimonialCardProps>(
  ({ name, rating, comment, location, className = '', style }, ref) => {
    return (
      <div ref={ref} className={`bg-white p-6 text-center space-y-4 rounded-xl shadow-md hover:shadow-lg transition-shadow ${className}`} style={style}>
        <div className="flex justify-center space-x-1 mb-4">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`h-5 w-5 ${
                i < rating 
                  ? 'text-amber-500 fill-current' 
                  : 'text-gray-300'
              }`}
            />
          ))}
        </div>
        
        <blockquote className="text-gray-500 italic leading-relaxed">
          "{comment}"
        </blockquote>
        
        <div className="pt-4 border-t border-gray-200">
          <p className="font-semibold text-gray-800">{name}</p>
          {location && (
            <p className="text-sm text-gray-500">{location}</p>
          )}
        </div>
      </div>
    );
  }
);