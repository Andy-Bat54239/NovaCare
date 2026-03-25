import amoxil from '../assets/medicines/amoxil.jpeg';
import advil from '../assets/medicines/advil.jpeg';
import glucophage from '../assets/medicines/glucophage.jpeg';
import norvasc from '../assets/medicines/norvasc.jpeg';
import tylenol from '../assets/medicines/tylenol.jpeg';
import Prilosec from '../assets/medicines/Prilosec.jpeg';
import Zyrtec from '../assets/medicines/Zyrtec.jpeg';
import Lipitor from '../assets/medicines/Lipitor.jpeg';
import zithromax from '../assets/medicines/zithromax.jpeg';
import Ventolin from '../assets/medicines/Ventolin.jpeg';
import Celin from '../assets/medicines/Celin.jpeg';
import cortef from '../assets/medicines/cortef.jpeg';
import Cozaar from '../assets/medicines/Cozaar.jpeg';
import Flagyl from '../assets/medicines/Flagyl.jpeg';
import Cipro from '../assets/medicines/Cipro.jpeg';
import Centrum from '../assets/medicines/Centrum.jpeg';
import Voltaren from '../assets/medicines/Voltaren.jpeg';
import Zantac from '../assets/medicines/Zantac.jpeg';
import Canesten from '../assets/medicines/Canesten.jpeg';
import Lantus from '../assets/medicines/Lantus.jpeg';
import Zestril from '../assets/medicines/Zestril.jpeg';
import Vibramycin from '../assets/medicines/Vibramycin.jpeg';
import Claritin from '../assets/medicines/Claritin.jpeg';
import Caltrate from '../assets/medicines/Caltrate.jpeg';

export const medicines = [
  { id: 1, genericName: 'Amoxicillin', brandName: 'Amoxil', strength: '500mg', form: 'Capsule', category: 'Antibiotics', requiresPrescription: true, price: 16900, image: amoxil, description: 'A penicillin-type antibiotic used to treat a wide variety of bacterial infections.' },
  { id: 2, genericName: 'Ibuprofen', brandName: 'Advil', strength: '200mg', form: 'Tablet', category: 'Pain Relief', requiresPrescription: false, price: 11000, image: advil, description: 'A nonsteroidal anti-inflammatory drug used to reduce fever and treat pain or inflammation.' },
  { id: 3, genericName: 'Metformin', brandName: 'Glucophage', strength: '500mg', form: 'Tablet', category: 'Diabetes', requiresPrescription: true, price: 19500, image: glucophage, description: 'An oral diabetes medicine that helps control blood sugar levels.' },
  { id: 4, genericName: 'Amlodipine', brandName: 'Norvasc', strength: '5mg', form: 'Tablet', category: 'Cardiovascular', requiresPrescription: true, price: 24100, image: norvasc, description: 'A calcium channel blocker used to treat high blood pressure and coronary artery disease.' },
  { id: 5, genericName: 'Paracetamol', brandName: 'Tylenol', strength: '500mg', form: 'Tablet', category: 'Pain Relief', requiresPrescription: false, price: 7800, image: tylenol, description: 'An analgesic and antipyretic used to treat mild to moderate pain and reduce fever.' },
  { id: 6, genericName: 'Omeprazole', brandName: 'Prilosec', strength: '20mg', form: 'Capsule', category: 'Gastrointestinal', requiresPrescription: false, price: 20800, image: Prilosec, description: 'A proton pump inhibitor used to treat gastroesophageal reflux disease and stomach ulcers.' },
  { id: 7, genericName: 'Cetirizine', brandName: 'Zyrtec', strength: '10mg', form: 'Tablet', category: 'Respiratory', requiresPrescription: false, price: 13000, image: Zyrtec, description: 'An antihistamine used to relieve allergy symptoms such as runny nose and sneezing.' },
  { id: 8, genericName: 'Atorvastatin', brandName: 'Lipitor', strength: '20mg', form: 'Tablet', category: 'Cardiovascular', requiresPrescription: true, price: 29900, image: Lipitor, description: 'A statin medication used to prevent cardiovascular disease and treat abnormal lipid levels.' },
  { id: 9, genericName: 'Azithromycin', brandName: 'Zithromax', strength: '250mg', form: 'Tablet', category: 'Antibiotics', requiresPrescription: true, price: 26000, image: zithromax, description: 'A macrolide antibiotic used to treat various bacterial infections.' },
  { id: 10, genericName: 'Salbutamol', brandName: 'Ventolin', strength: '100mcg', form: 'Injection', category: 'Respiratory', requiresPrescription: true, price: 32500, image: Ventolin, description: 'A bronchodilator used to relieve bronchospasm in conditions such as asthma.' },
  { id: 11, genericName: 'Vitamin C', brandName: 'Celin', strength: '500mg', form: 'Tablet', category: 'Vitamins', requiresPrescription: false, price: 8400, image: Celin, description: 'An essential vitamin supplement to support immune function and overall health.' },
  { id: 12, genericName: 'Hydrocortisone', brandName: 'Cortef', strength: '1%', form: 'Cream', category: 'Dermatology', requiresPrescription: false, price: 15600, image: cortef, description: 'A topical corticosteroid used to reduce inflammation, redness, and itching of the skin.' },
  { id: 13, genericName: 'Losartan', brandName: 'Cozaar', strength: '50mg', form: 'Tablet', category: 'Cardiovascular', requiresPrescription: true, price: 21500, image: Cozaar, description: 'An angiotensin receptor blocker used to treat high blood pressure.' },
  { id: 14, genericName: 'Metronidazole', brandName: 'Flagyl', strength: '400mg', form: 'Tablet', category: 'Antibiotics', requiresPrescription: true, price: 14300, image: Flagyl, description: 'An antibiotic and antiprotozoal medication used to treat bacterial and parasitic infections.' },
  { id: 15, genericName: 'Ciprofloxacin', brandName: 'Cipro', strength: '500mg', form: 'Tablet', category: 'Antibiotics', requiresPrescription: true, price: 18200, image: Cipro, description: 'A fluoroquinolone antibiotic used to treat a variety of bacterial infections.' },
  { id: 16, genericName: 'Multivitamin', brandName: 'Centrum', strength: 'Complex', form: 'Tablet', category: 'Vitamins', requiresPrescription: false, price: 16200, image: Centrum, description: 'A comprehensive multivitamin supplement for daily nutritional support.' },
  { id: 17, genericName: 'Diclofenac', brandName: 'Voltaren', strength: '50mg', form: 'Tablet', category: 'Pain Relief', requiresPrescription: false, price: 12300, image: Voltaren, description: 'A nonsteroidal anti-inflammatory drug used to treat pain and inflammatory disorders.' },
  { id: 18, genericName: 'Ranitidine', brandName: 'Zantac', strength: '150mg', form: 'Tablet', category: 'Gastrointestinal', requiresPrescription: false, price: 14900, image: Zantac, description: 'An H2 blocker used to reduce stomach acid production and treat heartburn.' },
  { id: 19, genericName: 'Clotrimazole', brandName: 'Canesten', strength: '1%', form: 'Cream', category: 'Dermatology', requiresPrescription: false, price: 11700, image: Canesten, description: 'An antifungal medication used to treat skin infections such as athletes foot and ringworm.' },
  { id: 20, genericName: 'Insulin Glargine', brandName: 'Lantus', strength: '100IU/ml', form: 'Injection', category: 'Diabetes', requiresPrescription: true, price: 59800, image: Lantus, description: 'A long-acting insulin used to treat diabetes mellitus.' },
  { id: 21, genericName: 'Lisinopril', brandName: 'Zestril', strength: '10mg', form: 'Tablet', category: 'Cardiovascular', requiresPrescription: true, price: 19500, image: Zestril, description: 'An ACE inhibitor used to treat high blood pressure and heart failure.' },
  { id: 22, genericName: 'Doxycycline', brandName: 'Vibramycin', strength: '100mg', form: 'Capsule', category: 'Antibiotics', requiresPrescription: true, price: 15600, image: Vibramycin, description: 'A tetracycline antibiotic used to treat bacterial infections and prevent malaria.' },
  { id: 23, genericName: 'Loratadine', brandName: 'Claritin', strength: '10mg', form: 'Tablet', category: 'Respiratory', requiresPrescription: false, price: 13600, image: Claritin, description: 'A non-drowsy antihistamine used to relieve symptoms of seasonal allergies.' },
  { id: 24, genericName: 'Calcium + Vitamin D', brandName: 'Caltrate', strength: '600mg', form: 'Tablet', category: 'Vitamins', requiresPrescription: false, price: 18200, image: Caltrate, description: 'A calcium supplement with vitamin D for bone health support.' },
];

export default medicines;
