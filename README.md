🧬 protein_selector
A lightweight, interactive Python tool designed to convert nucleotide sequences (DNA/RNA) into amino acid chains. It supports standard FASTA file input and features an interactive UI that lets you drag and drop amino acids directly into your translated sequence.

✨ Features
Nucleotide to Amino Acid Translation: Easily translate DNA or RNA sequences using standard genetic code tables.

FASTA File Support: Parse and process standard .fasta or .fa files seamlessly.

Interactive Drag-and-Drop: Modify or edit your translated amino acid chain interactively by dragging standard amino acids into specific sequence positions.

Reading Frame Selection: Translate sequences across different reading frames (+1, +2, +3).

🚀 Getting Started
Prerequisites
Python 3.8 or higher

Required dependencies (install via requirements.txt if available):

Bash
pip install -r requirements.txt
Installation
Clone the repository to your local machine:

Bash
git clone https://github.com/TommasoOttocento/protein_selector.git
cd protein_selector
🛠️ Usage
Running the Application
Start the tool by running the main entry script:

Bash
python main.py
Key Workflows
Upload / Load FASTA: Click the upload button or specify your .fasta path to load single or multi-sequence files.

Translate: Select your desired reading frame and hit Translate to view the resulting amino acid sequence (single-letter or three-letter codes).

Drag & Drop Editing:

Open the Amino Acid Palette.

Drag any standard amino acid into the active translated sequence to insert, replace, or experiment with point mutations in real time.

📁 Repository Structure
Plaintext
protein_selector/
├── data/              # Sample FASTA files for testing
├── src/               # Core logic (parser, translation engine, UI components)
├── main.py            # Main application entry point
├── requirements.txt   # Project dependencies
└── README.md          # Project documentation
🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page if you want to report a bug or suggest an enhancement.

Fork the Project

Create your Feature Branch (git checkout -b feature/NewFeature)

Commit your Changes (git commit -m 'Add some NewFeature')

Push to the Branch (git push origin feature/NewFeature)

Open a Pull Request

📜 License
Distributed under the MIT License. See LICENSE for more information.
