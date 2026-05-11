
const Nofinish = ({ onFinish }) => {

    
    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-200 p-4">
            <div className="bg-white p-8 rounded-xl shadow-2xl flex flex-col items-center w-full max-w-lg">
                
              

                <div className="flex flex-col items-center  mt-4 w-full">
                    
                    <div className="flex-1 flex items-center mt-6 bg-gray-200 rounded-xl px-4 py-2">
        
                        <textarea 
                            type="text" 
                            className="bg-transparent w-full outline-none text-black font-medium resize-none overflow-hidden "
                            placeholder='Décrivez le problème...'
                            
                        >
                                
                        </textarea>
                        
                    </div>
                </div>

                <div className="w-full flex justify-end mt-8">
                        <button 
                            onClick={onFinish}
                            type="button" 
                            className="bg-blue-400 text-white px-8 py-2 rounded-lg font-semibold hover:bg-black hover:text-white transition-colors"
                        >
                           Envoyer
                        </button>
                </div>
            </div>
        </div>
    );
};

export default Nofinish;