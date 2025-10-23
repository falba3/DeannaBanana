"use client";

import { useState } from "react";
import Image from "next/image";

const clothes = ["clothes1.jpeg", "clothes2.jpeg"];
const people = ["person1.jpg", "person2.jpg", "person3.jpg"];

export default function Home() {
  const [selectedCloth, setSelectedCloth] = useState<string | null>(null);
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100">
      <main className="container mx-auto flex flex-col items-center justify-center p-4">
        <h1 className="mb-8 text-4xl font-bold">Virtual Try-On</h1>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="flex flex-col items-center">
            <h2 className="mb-4 text-2xl font-semibold">1. Choose a Clothing Item</h2>
            <div className="grid grid-cols-2 gap-4">
              {clothes.map((cloth) => (
                <div
                  key={cloth}
                  className={`cursor-pointer rounded-lg border-4 ${
                    selectedCloth === cloth ? "border-blue-500" : "border-transparent"
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

          <div className="flex flex-col items-center">
            <h2 className="mb-4 text-2xl font-semibold">2. Choose a Person or Upload</h2>
            <div className="grid grid-cols-3 gap-4">
              {people.map((person) => (
                <div
                  key={person}
                  className={`cursor-pointer rounded-lg border-4 ${
                    selectedPerson === person ? "border-blue-500" : "border-transparent"
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
                className="cursor-pointer rounded-lg bg-blue-500 px-8 py-4 text-white hover:bg-blue-600"
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
            className="rounded-lg bg-blue-500 px-8 py-4 text-white hover:bg-blue-600 disabled:bg-gray-400"
            disabled={!selectedCloth || (!selectedPerson && !uploadedImage)}
          >
            Generate Image
          </button>
        </div>

        {generatedImage && (
          <div className="mt-8">
            <h2 className="mb-4 text-2xl font-semibold">Generated Image</h2>
            <Image
              src={`data:${generatedImage.mimeType};base64,${generatedImage.data}`}
              alt="Generated Image"
              width={400}
              height={400}
              className="rounded-lg"
            />
          </div>
        )}
      </main>
    </div>
  );
}