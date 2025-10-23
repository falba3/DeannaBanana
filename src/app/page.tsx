"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

const people = ["person1.jpg", "person2.jpg", "person3.jpg"];

export default function Home() {
  const [clothes, setClothes] = useState<string[]>([]);
  const [selectedCloth, setSelectedCloth] = useState<string | null>(null);

  useEffect(() => {
    const fetchClothes = async () => {
      const response = await fetch('/api/clothes');
      const data = await response.json();
      setClothes(data);
    };
    fetchClothes();
  }, []);
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<any | null>(null);

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        setSelectedPerson(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!selectedCloth || (!selectedPerson && !uploadedImage)) {
      return;
    }

    const person = selectedPerson ? `/people/${selectedPerson}` : uploadedImage;

    const response = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ cloth: `/clothes/${selectedCloth}`, person }),
    });

    if (response.ok) {
      const { image } = await response.json();
      setGeneratedImage(image.inlineData);
    } else {
      console.error("Failed to generate image");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header */}
      <header className="w-full bg-white py-6 border-b border-gray-100">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <Image
            src="/bvmprs-logo.svg"
            alt="BVMPRS BRAND"
            width={200}
            height={40}
            className="object-contain"
            priority
          />
          <div className="text-[#0A0F2C] text-sm font-light">Virtual Try-On Demo</div>
        </div>
      </header>
      
      <main className="container mx-auto flex flex-col items-center justify-center p-8 text-[#0A0F2C]">
        <h1 className="mb-12 text-4xl font-light tracking-wider uppercase">Virtual Try-On Experience</h1>

        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 w-full">
          <div className="flex flex-col items-center bg-white p-8 rounded-xl shadow-lg">
            <h2 className="mb-6 text-2xl font-light uppercase tracking-wider text-[#0A0F2C]">1. Select Your Style</h2>
            <div className="h-[500px] w-full overflow-y-auto custom-scrollbar rounded-lg border border-gray-200 p-6">
              <div className="grid grid-cols-2 gap-6">
                {clothes.map((cloth) => (
                  <div
                    key={cloth}
                    className={`cursor-pointer rounded-lg transition-all duration-300 hover:scale-105 ${
                      selectedCloth === cloth ? "ring-2 ring-[#0A0F2C] shadow-lg" : "border border-gray-200"
                    }`}
                    onClick={() => setSelectedCloth(cloth)}
                  >
                    <Image
                      src={`/clothes/${cloth}`}
                      alt={cloth}
                      width={200}
                      height={200}
                      className="rounded-lg"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center bg-white p-8 rounded-xl shadow-lg">
            <h2 className="mb-6 text-2xl font-light uppercase tracking-wider text-[#0A0F2C]">2. Choose Your Model</h2>
            <div className="grid grid-cols-3 gap-6">
              {people.map((person) => (
                <div
                  key={person}
                  className={`cursor-pointer rounded-lg transition-all duration-300 hover:scale-105 ${
                    selectedPerson === person ? "ring-2 ring-[#0A0F2C] shadow-lg" : "border border-gray-200"
                  }`}
                  onClick={() => {
                    setSelectedPerson(person);
                    setUploadedImage(null);
                  }}
                >
                  <Image
                    src={`/people/${person}`}
                    alt={person}
                    width={150}
                    height={150}
                    className="rounded-lg"
                  />
                </div>
              ))}
            </div>
            <div className="mt-8">
              <input
                type="file"
                accept="image/*"
                onChange={handleUpload}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer rounded-lg border-2 border-[#0A0F2C] px-8 py-4 text-[#0A0F2C] transition-all duration-300 hover:bg-[#0A0F2C] hover:text-white inline-block"
              >
                Upload Your Photo
              </label>
            </div>
            {uploadedImage && (
              <div className="mt-6">
                <Image
                  src={uploadedImage}
                  alt="Uploaded"
                  width={150}
                  height={150}
                  className="rounded-lg border border-gray-200 shadow-md"
                />
              </div>
            )}
          </div>
        </div>

        <div className="mt-12">
          <button
            onClick={handleGenerate}
            className="rounded-lg bg-[#0A0F2C] px-12 py-4 text-white font-light tracking-wider hover:bg-[#162052] transition-all duration-300 disabled:bg-gray-200 disabled:text-gray-400"
            disabled={!selectedCloth || (!selectedPerson && !uploadedImage)}
          >
            GENERATE LOOK
          </button>
        </div>

        {generatedImage && (
          <div className="mt-12 bg-white p-8 rounded-xl shadow-lg">
            <h2 className="mb-6 text-2xl font-light uppercase tracking-wider text-[#0A0F2C]">Your Generated Look</h2>
            <div className="border border-gray-200 rounded-lg p-2 shadow-sm">
              <Image
                src={`data:${generatedImage.mimeType};base64,${generatedImage.data}`}
                alt="Generated Image"
                width={400}
                height={400}
                className="rounded-lg"
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}