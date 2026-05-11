import { useState } from 'react';
import { CheckCircle , Star} from 'lucide-react';

const Remerciement = ({ onRemerc }) => {

    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-200 p-4">
            <div className="bg-white p-8 rounded-xl shadow-2xl flex flex-col items-center w-full max-w-lg">
                
                <CheckCircle 
                    size={50} 
                    className="text-white fill-[#0D2B0D] mb-6" 
                    strokeWidth={3}
                />
                <p className="text-center text-2xl text-black mt-4 font-bold">
                    Nous vous remercions pour <br /> votre confiance
                </p>

                {/* Section Étoiles */}
                <div className="flex gap-2 mt-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHover(star)}
                            onMouseLeave={() => setHover(0)}
                            className="focus:outline-none transition-transform hover:scale-110"
                        >
                            <Star
                                size={35}
                                className={`${
                                    star <= (hover || rating) 
                                    ? "text-yellow-400 fill-yellow-400" 
                                    : "text-gray-300"
                                } transition-colors duration-200`}
                            />
                        </button>
                    ))}
                </div>

                <div className="flex flex-col items-center  mt-4 w-full">
                    <label className="font-bold text-black whitespace-nowrap">
                        Votre avis sur le service 
                    </label>
                    <div className="flex-1 flex items-center mt-6 bg-gray-200 rounded-xl px-4 py-2">
                        
                        <textarea 
                            type="text" 
                            className="bg-transparent w-full outline-none text-black font-medium resize-none overflow-hidden "
                            placeholder='Votre avis...'
                            
                        >
                                
                        </textarea>
                        
                    </div>
                </div>

                <div className="w-full flex justify-end mt-8">
                        <button 
                            onClick={onRemerc}
                            type="button" 
                            className="bg-[#608C27] text-white px-8 py-2 rounded-lg font-semibold hover:bg-black hover:text-white transition-colors"
                        >
                           OK
                        </button>
                </div>
            </div>
        </div>
    );
};

export default Remerciement;