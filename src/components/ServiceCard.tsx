import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ServiceCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  price: string;
  duration: string;
  features: string[];
  featured?: boolean;
}

export const ServiceCard = ({ 
  icon, 
  title, 
  description, 
  price, 
  duration, 
  features, 
  featured = false 
}: ServiceCardProps) => {
  return (
    <div className={`bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow relative ${featured ? 'ring-2 ring-amber-500/50' : ''}`}>
      {featured && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-amber-500 text-white px-4 py-1 text-sm font-medium rounded-full">
            Mais Popular
          </span>
        </div>
      )}
      
      <div className="flex justify-center mb-6">
        <div className="p-4 rounded-2xl bg-amber-500/10 text-amber-500">
          {icon}
        </div>
      </div>
      
      <h3 className="text-2xl font-bold mb-3 text-gray-800">{title}</h3>
      <p className="text-gray-500 mb-6 leading-relaxed">{description}</p>
      
      <div className="flex justify-center items-baseline mb-6">
        <span className="text-4xl font-bold text-amber-500">{price}</span>
        <span className="text-gray-500 ml-2">/ {duration}</span>
      </div>
      
      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start space-x-3">
            <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-gray-500">{feature}</span>
          </li>
        ))}
      </ul>
      
      <Button 
        asChild 
        className={`w-full ${featured ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'border-amber-500 text-amber-500 hover:bg-amber-500/10'}`}
        size="lg"
        variant={featured ? 'default' : 'outline'}
      >
        <Link to="/agendamento">
          Agendar Este Serviço
        </Link>
      </Button>
    </div>
  );
};