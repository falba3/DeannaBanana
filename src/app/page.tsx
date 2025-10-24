"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

const people = ["person1.jpg", "person2.jpg", "person3.jpg"];

export default function Home() {
  const [clothes, setClothes] = useState<string[]>([]);
  const [selectedClothes, setSelectedClothes] = useState<string[]>([]);

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
  const [generatedImages, setGeneratedImages] = useState<any[]>([]);

  const handleClothClick = (cloth: string) => {
    setSelectedClothes((prevSelected) =>
      prevSelected.includes(cloth)
        ? prevSelected.filter((item) => item !== cloth)
        : [...prevSelected, cloth]
    );
  };

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
    if (selectedClothes.length === 0 || (!selectedPerson && !uploadedImage)) {
      return;
    }

    setGeneratedImages([]); // Clear previous generated images
    const person = selectedPerson ? `/people/${selectedPerson}` : uploadedImage;

    for (const cloth of selectedClothes) {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cloth: `/clothes/${cloth}`, person }),
      });

      if (response.ok) {
        const { image } = await response.json();
        setGeneratedImages((prevImages) => [...prevImages, image.inlineData]);
      } else {
        console.error(`Failed to generate image for ${cloth}`);
      }
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-purple-200">
      {/* Header */}
      <header className="w-full bg-purple-200 py-6 shadow-xl">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <Image
            src="/bvmprs-logo.svg"
            alt="BVMPRS BRAND"
            width={200}
            height={40}
            className="object-contain"
            priority
          />
          <div className="text-purple-700 text-lg font-semibold">Deanna2u</div>
        </div>
      </header>

      <main className="container mx-auto flex flex-col items-center justify-center p-4">
        <h1 className="mb-8 text-5xl font-semibold tracking-wide text-purple-800">Virtual Try-On</h1>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="flex flex-col items-center bg-white p-8 rounded-xl shadow-lg">
            <h2 className="mb-6 text-2xl font-medium text-purple-700">Choose a Clothing Item</h2>
            <div className="h-96 w-full overflow-y-auto rounded-lg border-4 border-purple-300 p-4">
              <div className="grid grid-cols-2 gap-4">
                {clothes.map((cloth) => (
                  <div
                    key={cloth}
                    className={`cursor-pointer rounded-lg transition-all duration-300 hover:scale-105 ${
                      selectedClothes.includes(cloth) ? "ring-2 ring-purple-500 ring-offset-2" : "border border-gray-200"
                    }`}                    onClick={() => handleClothClick(cloth)}
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
            <h2 className="mb-6 text-2xl font-medium text-purple-700">Choose a Person or Upload</h2>
            <div className="grid grid-cols-3 gap-4">
              {people.map((person) => (
                <div
                  key={person}
                  className={`cursor-pointer rounded-lg transition-all duration-300 hover:scale-105 ${
                    selectedPerson === person ? "ring-2 ring-purple-500 ring-offset-2" : "border border-gray-200"
                  }`}                  onClick={() => {
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
            <div className="mt-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleUpload}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer rounded-lg bg-purple-600 px-6 py-3 text-white hover:bg-purple-700 shadow-md"
              >
                Upload Image
              </label>
            </div>
            {uploadedImage && (
              <div className="mt-4">
                <Image
                  src={uploadedImage}
                  alt="Uploaded"
                  width={150}
                  height={150}
                  className="rounded-lg"
                />
              </div>
            )}
          </div>
        </div>

        <div className="mt-8">
          <button
            onClick={handleGenerate}
            className="rounded-lg bg-purple-600 px-6 py-3 text-white hover:bg-purple-700 disabled:bg-purple-400 shadow-md"
            disabled={selectedClothes.length === 0 || (!selectedPerson && !uploadedImage)}
          >
            Generate Image
          </button>
        </div>

        {generatedImages.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-4 text-2xl font-semibold">Generated Images</h2>
            <div className="grid grid-cols-2 gap-4">
              {generatedImages.map((image, index) => (
                <Image
                  key={index}
                  src={`data:${image.mimeType};base64,${image.data}`}
                  alt={`Generated Image ${index + 1}`}
                  width={400}
                  height={400}
                  className="rounded-lg"
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
