import Image from "next/image";
import Link from "next/link";
import Footer from "../components/Footer";
import Header from "../components/Header";
import SquigglyLines from "../components/SquigglyLines";

export default function HomePage() {
  return (
    <div className="flex max-w-6xl mx-auto flex-col items-center justify-center py-2 min-h-screen">
      <Header />
      <main className="flex flex-1 w-full flex-col items-center justify-center text-center px-4 sm:mt-20 mt-20 background-gradient">
        <h1 className="mx-auto max-w-4xl font-display text-5xl font-bold tracking-normal text-gray-300 sm:text-7xl">
          Generating your {" "}
          <span className="relative whitespace-nowrap text-amber-400">
            <SquigglyLines />
            <span className="relative">Simpson </span>    
          </span>{" "}
          avatar using  
          <span className="relative whitespace-nowrap text-amber-400"> AI </span>.
        </h1>
        <h2 className="mx-auto mt-12 max-w-xl text-lg sm:text-gray-400  text-gray-500 leading-7">
          Take a picture of you  and see how you looks in Simpson style. 
            100% free – Make a yallow avatar today.
        </h2>
        <Link
          className="bg-amber-400 rounded-xl text-white font-medium px-4 py-3 sm:mt-10 mt-8 hover:bg-amber-500 transition"
          href="/dream"
        > 
          Generate your Avatar
        </Link>
        <div className="flex justify-between items-center w-full flex-col sm:mt-10 mt-6">
          <div className="flex flex-col space-y-10 mt-4 mb-16">
            <div className="flex sm:space-x-8 sm:flex-row flex-col">
              <div>
                <h3 className="mb-1 font-medium text-lg">Generated Picture</h3>
                <Image
                  alt="Generated photo "
                  src="/generated-pic.jpg"
                  className="w-full object-cover h-96 rounded-2xl"
                  width={400}
                  height={400}
                />
              </div>
              <div className="sm:mt-0 mt-8">
                <h3 className="mb-1 font-medium text-lg">Generated Avatar</h3>
                <Image
                  alt="Generated photo of a avatar with simpsonify"
                  width={400}
                  height={400}
                  src="/generated-pic-2.png"
                  className="w-full object-cover h-96 rounded-2xl sm:mt-0 mt-2"
                />
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
