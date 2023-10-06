import React from 'react';
import './tailwind.js';
import {useState, useRef, useEffect} from 'react';

const API_URL = "https://www.whispernotes.xyz/api";
//const API_URL = "http://localhost:3000/api";

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      auth: null,
      endDate: null,
      current_plan: null,
      userInfo: null,
      cleanup_enabled: null,
      cleanup_prompt: null,
      minutes_used: null,
      openaiKey: null,
      view: "notes",
      tags: null,
      notes: null,
      selectedTags: [],
      searched: false,
      searching: false,
      searchTerm: "",
      editNote: null,
      recordedNote: null,


    }
    this.search = this.search.bind(this);
  }

  search() {

    let selectedTags = this.state.selectedTags;
    let searchTerm = this.state.searchTerm.trim();


    this.setState({searching: true})
    
    if (searchTerm.trim() == "" && selectedTags.length == 0) {
      
      fetch(API_URL + "/getNotes", {
        method: "POST",
        credentials: "include"
      }).then(resp => resp.json())
        .then(resp => {
          this.setState({ notes: resp.notes, searching: false });
        }).catch(err => {
        });

   

      return;
    }


    this.setState({ searched: true, searching: true });


    fetch(API_URL + "/searchNotes", {
      method: "POST",
      credentials: "include",
      body: JSON.stringify({ tags: selectedTags, searchTerm: searchTerm })

    }).then(resp => resp.json()).then(resp => {
      this.setState({ notes: resp.notes,  searching: false });
    }).catch(err => {
      alert("error")
      this.setState({ searching: false })
    })

    if (this.state.selectedTags.length == 0) {
      this.setState({searched: false})
    } else {
      this.setState({searched: true})
    }
  

  }

  componentDidMount() {

    fetch(API_URL + "/userInfo", {
          method: "POST",
      credentials: "include"
      
    }).then(resp => resp.json()).then(resp => {

      this.setState({ auth: true, endDate: resp.endDate, current_plan: resp.current_plan, userInfo: resp, cleanup_enabled: resp.cleanup_enabled, cleanup_prompt: resp.cleanup_prompt, minutes_used: resp.minutes_used == null ? 0 : resp.minutes_used, openaiKey: resp.openaiKey });
      chrome.storage.sync.set({ auth: true });
      
    }).catch(err => {
      this.setState({auth: false})
    })
      
    chrome.storage.sync.get(['auth'], (result) => {
      if (result.auth) {
        this.setState({ auth: true });

      } else {
      }
    })

    fetch(API_URL + "/getNotes", {
      method: "POST",
      credentials: "include"
    }).then(resp => {
      return resp.json();
    }).then((resp) => {
      this.setState({ notes: resp.notes });

    }).catch(err => {

    });


    fetch(API_URL + "/getTags", {
      method: "POST",
      credentials: "include"
    }).then(resp => {
      return resp.json();
    }).then((resp) => {
      this.setState({ tags: resp.tags });

    }).catch(err => {

     });



  }

  render() {
    if (this.state.auth == false) {
      return (<RegistrationSnippet></RegistrationSnippet>)
    }

    if (this.state.recordedNote != null) {
      return (<EditRecordedNote
        addNote={(note) => {
          let notes = this.state.notes;
          let newNotes = [note];
          newNotes.push(...notes);
          this.setState({ notes: newNotes, view: "notes", recordedNote: null });
        }}
        setTags={(tags) => {
            
            this.setState({ tags: tags });
        }
        }
        openaiKey={this.state.openaiKey}
        deleteNote={() => {
          this.setState({ recordedNote: null, view: "notes" })
        }}
        cleanup_enabled={this.state.cleanup_enabled}
        allTags={this.state.tags}
        note={this.state.recordedNote}></EditRecordedNote>)
        
    }

    if (this.state.view == "edit") {
      return (<EditView
        openaiKey={this.state.openaiKey}
        setNotes={
          note => {
            this.setState({ editNote: null, view: "notes" });
            let notes = this.state.notes;
            for (let i = 0; i < notes.length; i++) {
              if (notes[i].id == note.id) {
                notes[i] = note;
                break;
              }
            }
            this.setState({ notes: notes });
          }
        }
        setTags={(tags) => {

          this.setState({ tags: tags });
        }}
        
        
        allTags={this.state.tags}
        setView={(view) => {
          this.setState({ view: view })
        }
        }
        deleteNote={() => {
          let notes = this.state.notes;
          for (let i = 0; i < notes.length; i++) {
            if (notes[i].id == this.state.editNote.id) {
              notes.splice(i, 1);
              break;
            }
          }

          this.setState({ notes: notes, view: "notes", subView: "" });

          fetch(API_URL + "/deleteNote", {
            method: "POST",
            credentials: "include",
            body: JSON.stringify({ noteId: this.state.editNote.id })
          }).then(resp => {
            return resp.json();
          }).then((r) => {
            return;
          }).catch(e => {

          })
        }}
        note={this.state.editNote}></EditView>)
    }

    if (this.state.view == "notes") {
      return (
        <>
          
          
          <NotesView
            current_plan={this.state.current_plan}
            minutes_used={this.state.minutes_used}
          searching={this.state.searching}
          searchTerm={this.state.searchTerm}
          updateSearchTerm={(searchTerm) => {
            this.setState({ searchTerm: searchTerm })
          }}
          searched={this.state.searched}
          search={() => {
            this.search();
          }}
          clearTags={() => {
            this.setState({ selectedTags: [] }, () => {
              if (this.state.searched == true) {
                this.search();
              }
            });
          }}
          selectTag={(tag) => {
            let newSelectedTags = this.state.selectedTags;
            
            if (newSelectedTags.includes(tag)) {
              newSelectedTags.splice(newSelectedTags.indexOf(tag), 1);
            } else {
              newSelectedTags.push(tag);
            }

            this.setState({ selectedTags: newSelectedTags, searched: false });

          }
          }
          selectedTags={this.state.selectedTags}
          tags={this.state.tags}
          notes={this.state.notes}
          setEditNote={(note) => {
            this.setState({ editNote: note })
          }}
          changeView={(view) => {
          this.setState({ view: view })
            }}></NotesView>
          </>
      )
    } else if (this.state.view == "record") {
      return (
        <RecordView
          setRecordedNote={(note) => {
            this.setState({ recordedNote: note });
          }}
          minutes_used={this.state.minutes_used}
          updateMinutesUsed={(minutes_used) => {
            this.setState({ minutes_used: minutes_used });
          }}
          openaiKey={this.state.openaiKey}
          cleanup_enabled={this.state.cleanup_enabled}
          cleanup_prompt={this.state.cleanup_prompt}
          
          changeView={(view) => {
          this.setState({ view: view })
        }}></RecordView>
      )
    }
    
    }
    
      
    
  
}
const upload = (presigned_url, file, callback) => {
  const formData = new FormData();


  formData.append('file', file);


  fetch(presigned_url, {
    method: 'PUT',
    body: formData,
    headers: {
      'Content-Type': 'audio/mp4'
    }
  }).then(resp => {
    callback();
  }).catch(err => {
    alert("There wasan error uploading your audio. Please try again.")

  });


}

class UpgradePlan extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      loadingMonthly: false,
      loadingYearly: false,
    }
  }
  render() {
    return (
      <div className={"flex flex-col items-center"}>
        {
          this.props.current_plan == "free" && this.props.minutes_used / 300 > 1 &&
          <div style={{ width: 330 }}>
            You have run out of free minutes. Please upgrade to continue using WhisperNotes.
          </div>
        }
        <div
          style={{ width: "100%" }}
          className={"flex flex-row items-center justify-center"}>

          <div
            className={"overflow-y-scroll grid lg:grid-cols-2 md:grid-cols-2 sm:grid-cols-1 grid-cols-1 gap-x-4 gap-y-4 mt-5"}>
            <div className={"h-[200px] w-[300px] bg-zinc-800 rounded-lg"}>
              <div className={"flex flex-col items-center justify-center"}>
                <div className={"text-lg font-bold mt-3"}>Monthly</div>
                <div style={{ fontSize: 25 }} className={" font-bold mt-5 "}>$7/mo</div>
                <button
                  onClick={() => {
                    this.setState({ loadingMonthly: true })
                    axios.post("/api/monthlyPaymentLink").then(resp => {
                      window.location.href = resp.data.url;
                      this.setState({ loadingMonthly: false })

                    }).catch(err => {
                      this.setState({ loadingMonthly: false })

                      alert("Error creating payment link. Please try again later.")
                    })
                  }}
                  className={"bg-zinc-700 rounded-lg pl-4 pt-2 pb-2 pr-4 mt-7"}>{
                    this.state.loadingMonthly == false ? "Upgrade to Monthly" : <ThreeDots color={"white"} height={20} width={20}></ThreeDots>
                  }</button>
              </div>

            </div>

            <div className={"h-[200px] w-[300px] bg-zinc-800 rounded-lg"}>
              <div className={"flex flex-col items-center justify-center"}>
                <div className={"text-lg font-bold mt-3"}>Yearly</div>
                <div style={{ fontSize: 25 }} className={" font-bold mt-5 "}>$70/year</div>

                <button
                  onClick={() => {
                    this.setState({ loadingYearly: true })
                    axios.post("/api/yearlyPaymentLink").then(resp => {
                      window.location.href = resp.data.url;
                      this.setState({ loadingYearly: false })

                    }).catch(err => {
                      this.setState({ loadingYearly: false })

                      alert("Error creating payment link. Please try again later.")
                    })
                  }}

                  className={"bg-green-600 rounded-lg pl-4 pt-2 pb-2 pr-4 mt-7"}>
                  {
                    this.state.loadingYearly == false ? "Upgrade to Yearly" : <ThreeDots color={"white"} height={20} width={20}></ThreeDots>
                  }

                </button>
              </div>

            </div>

            <div
              onClick={() => {
                this.props.changeView("notes");
              }}

              className={"h-[50px] w-[300px] bg-zinc-800 rounded-lg cursor-pointer"}>
              <div className={"flex flex-col items-center justify-center"}>
                <div className={"text-lg font-bold mt-3"}>Go Back</div>

              </div>

            </div>


          </div>
        </div>
      </div>

    )
  }
}


class EditRecordedNote extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      transcribedText: this.props.note.transcribed_text,
      notesTitle: this.props.note.title,
      tags: [],
      showOriginal: false,
      originalText: this.props.note.original_text,
      tagsValue: "",
      showChat: false,
      showTag: false,
      allTags: this.props.allTags,
      chatHistory: [],
      chatQuestion: "",
      displayChatHistory: false, 
      audioURL: this.props.note.audioURL,
      newTags: [],
      saving: false,
      
    
    }
    this.addTag = this.addTag.bind(this);
    this.processChat = this.processChat.bind(this);
    this.removeTag = this.removeTag.bind(this);
    this.saveNote = this.saveNote.bind(this);
  }



    async saveNote() {
      if (this.state.notesTitle.trim() == "") {
        alert("Please enter a title for your note.");
      } else if (this.state.transcribedText.trim() == "") {
        alert("Please enter some text for your note.");
      } else {
        this.setState({ saving: true })
        let allTags = this.state.allTags;

        for (let i = 0; i < this.state.tags.length; i++) {
          if (allTags.includes(this.state.tags[i]) == false) {
            allTags.push(this.state.tags[i]);
          }
        }


        const response = await fetch(this.state.audioURL);
        const blob = await response.blob();


        
        fetch(API_URL + "/getPresignedUrl", {
          method: "POST",
          credentials: "include"
        }).then(resp => {

          return resp.json();
        }).then(resp => {


          
          upload(resp, blob, () => {

            fetch(API_URL + "/saveNote", {
              method: "POST",
              credentials: "include",
              body: JSON.stringify(
                {
                  title: this.state.notesTitle,
                  text: this.state.transcribedText,
                  url: resp.split("?")[0],
                  tags: this.state.tags,
                  original_text: this.state.originalText,
                  allTags: allTags,
                }
              )
            }).then(resp => {
              return resp.json()
            }).then(resp => {
              this.props.addNote(
                resp.note);
              this.setState({ saving: false });
            }).catch(e => {
              alert("Error saving note, please try again");
              this.setState({ saving: false });

            })

            

          })
          

        }).catch((error) => {
          alert("There was an error saving your note. Please try again.");
          this.setState({ saving: false });
        });

        

    
        this.props.setTags(allTags);


      }
    }

  removeTag(tag) {

    let tags = this.state.tags;

    tags = tags.filter((t) => {
      return t != tag;
    })

    let allTags = this.state.allTags;
    let newTags = this.state.newTags;

    if (newTags.includes(tag)) {
      newTags = newTags.filter((t) => {
        return t != tag;
      });

      allTags = allTags.filter((t) => {
        return t != tag;
      })

      this.setState({ allTags: allTags, newTags: newTags });


    }

    this.setState({ tags: tags });
  }

  processChat() {
    if (this.state.chatQuestion.trim() == "") {
      return;
    }
    this.setState({ processingChat: 1, displayChatHistory: false })

    let chatHistory = this.state.chatHistory;
    if (chatHistory.includes(this.state.chatQuestion) == false) {
      chatHistory.push(this.state.chatQuestion);
    }


    this.setState({ chatHistory });

    fetch("/api/updateChatQuestions", {
      method: "POST",
      credentials: "include",
      body: JSON.stringify(
        {
          chatQuestions: chatHistory,
        })
    }).then(resp => {

    }).catch(err => {
    })


    let messages = [{ role: "user", content: this.state.chatQuestion + " \n " + this.state.transcribedText }]

    let data = {
      "model": "gpt-3.5-turbo",
      "messages": messages,
    }


    fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + this.props.openaiKey,
      },
      body: JSON.stringify(data),
    }).then(resp => {
      return resp.json();
    }).then(resp => {


      this.setState({ transcribedText: resp.choices[0].message.content, processingChat: 0 });



    }).catch(e => {
      alert("error")
    })


  }

  componentDidMount() {
    fetch(API_URL + "/getChatQuestions", {
      method: "POST",
      credentials: "include",
    }).then(resp => {
      return resp.json();
    }).then(resp => {
       this.setState({ chatHistory: resp.chatQuestions })
    }).catch((err) => {

    }) 
  }



  addTag() {
    if (this.state.tagsValue.trim() == "") {
      this.setState({ tagsValue: "" });
      return;
    }

    let newTags = this.state.tagsValue.split(",").map(tag => tag.trim()).filter((tag) => { return tag.trim() != "" });

    let tags = this.state.tags;

    for (let i = 0; i < newTags.length; i++) {
      if (tags.includes(newTags[i]) == false) {
        tags.push(newTags[i].trim());
      }
    }
    this.setState({ tagsValue: "", tags: tags });

    let allTags = this.state.allTags;

    let brandNewTags = this.state.newTags;
    for (let i = 0; i < newTags.length; i++) {
      if (allTags.includes(newTags[i]) == false) {
        allTags.push(newTags[i].trim());
        brandNewTags.push(newTags[i].trim());
      }
    }

    this.setState({ allTags: allTags, newTags: brandNewTags });
  }


  render() {

    if (this.state.saving) {
      return (
        <div className={"flex bg-zinc-900 text-white h-[420px] w-[460px] flex flex-col overflow-scroll"}>
          <div className={"text-lg flex flex-row items-center justify-center font-bold mt-4"}><div>Saving Note</div></div>

          <div className={"flex flex-col items-center justify-center mt-10 text-lg"}>
            <div>Do not close the extension!</div>

            <div className={"mt-6 text-lg"}>Saving Note ...</div>
          </div>

        </div>
      );
    }
    return (
    <div className={"flex bg-zinc-900 text-white h-[420px] w-[460px] flex flex-col overflow-scroll"}>
      <div className={"text-lg flex flex-row items-center justify-center font-bold mt-4"}><div>Create Note</div></div>

        <div className={"mt-3 flex flex-row items-center justify-center"}>
          <AudioPlayer src={this.state.audioURL}></AudioPlayer>
        </div>

        <div style={{ marginTop: 30, width: 430, marginLeft: 15 }} className={"flex flex-row"}>


          <div

            onClick={() => {

            }}
            className={"bg-zinc-800 border border-zinc-700 rounded-lg text-white pl-2 pr-2 w-[170] items-center flex flex-row"}
            name="cars" id="cars" style={{ height: 40 }}>
            <div>


              <div
                onClick={() => {

                }}
                className={`${this.props.cleanup_enabled ? 'bg-green-500' : 'bg-gray-400'} cursor-pointer`}
                style={{ borderRadius: 14, height: 13, width: 13 }}></div>

              <div class="text-white text-sm rounded-lg flex flex-row items-center justify-center pl-2 pr-2 h-[20px] bg-blue-500 pointer-events-none absolute -top-7 left-0 w-max opacity-0 transition-opacity group-hover:opacity-100">
                {
                  "Edit Clean Up Prompt Configurations in settings"
                }
              </div>

              <div>

              </div>


            </div>
            <div
              className={"cursor-pointer"}
              style={{ marginLeft: 10, width: 100 }}>Clean Up Text</div>


          </div>
          <div
            className={"flex flex-row items-center justify-center"}
            style={{ marginLeft: "auto", marginRight: 5, marginBottom: 11 }}>






            <div className={"group relative w-max"}>


              <button
                onClick={() => {
                  this.saveNote();
                }}
                style={{}} className={"hover:bg-zinc-800 rounded-lg p-3"}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 24, height: 24 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
              </button>

              <div class="text-white text-sm rounded-lg flex flex-row items-center justify-center pl-2 pr-2 h-[20px] bg-blue-500 pointer-events-none absolute -top-7 left-0 w-max opacity-0 transition-opacity group-hover:opacity-100">
                {
                  "Save"
                }
              </div>

              <div>

              </div>

            </div>



            <div className={"group relative w-max"}>

              <button
                className={"hover:bg-zinc-800 rounded-lg p-3"}
                onClick={() => {
                  this.setState({ showTag: !this.state.showTag, showChat: false })
                }}>

                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                </svg>
              </button>

              <div
                class="text-white text-sm rounded-lg flex flex-row items-center justify-center pl-2 pr-2 h-[20px] bg-blue-500 pointer-events-none absolute -top-7 left-0 w-max opacity-0 transition-opacity group-hover:opacity-100">
                {
                  "Add Tag"
                }
              </div>

              <div>

              </div>

            </div>






            <Copy
              buttonClassName={"hover:bg-zinc-800 rounded-lg p-3"}
              className={"cursor-pointer w-5 h-5"}

              text={this.state.transcribedText}
              style={{}}></Copy>



            <div className={"group relative w-max"}>


              <button
                onClick={async () => {
                  // download the audio blob 


                  try {
                    const response = await fetch(this.state.audioURL);
                    const blob = await response.blob();

                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = this.props.note.title + ".mp3"; // Specify the desired file name for download
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                  } catch (error) {
                    console.error('Error downloading audio:', error);
                  }



                }}
                style={{}} className={"hover:bg-zinc-800 rounded-lg p-3 "}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={"w-5 h-5"} >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15M9 12l3 3m0 0l3-3m-3 3V2.25" />
                </svg>

              </button>

              <div class="text-white text-sm rounded-lg flex flex-row items-center justify-center pl-2 pr-2 h-[20px] bg-blue-500 pointer-events-none absolute -top-7 right-0 w-max opacity-0 transition-opacity group-hover:opacity-100">
                {
                  "Download Audio"
                }
              </div>

              <div>

              </div>

            </div>



            <div className={"group relative w-max"}>

              <div style={{}} className={"p-3 hover:bg-zinc-800 rounded-lg"}>
                <svg
                  onClick={() => {
                    this.props.deleteNote();

                  }}
                  xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={"w-5 h-5 cursor-pointer"}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </div>

              <div class="text-white text-sm rounded-lg flex flex-row items-center justify-center pl-2 pr-2 h-[20px] bg-blue-500 pointer-events-none absolute -top-7 left-0 w-max opacity-0 transition-opacity group-hover:opacity-100">
                {
                  "Delete"
                }
              </div>

              <div>

              </div>

            </div>





          </div>
        </div>

        {
          this.state.showTag &&
          <>

            <div
              className={"flex flex-row space-between flex-wrap space-x-2 space-y-2"}
              style={{ width: 430, marginLeft: 15 }}>
              <div></div>
              {
                this.state.allTags.map(tag => {
                  return (
                    <div
                      onClick={() => {
                        let tags = this.state.tags;
                        if (tags.includes(tag) == false) {
                          tags.push(tag);
                        }
                        this.setState({ tags: tags });
                      }}
                      className={"cursor-pointer bg-blue-500 text-sm pr-2 pl-2 h-[23px] rounded-lg"}>
                      <div className={""}>
                        {tag}
                      </div>
                    </div>

                  )

                })
              }
            </div>

            <input


              onKeyDown={(e) => {
                if (e.key == "Enter") {
                  this.addTag();
                }
              }}
              value={this.state.tagsValue}
              onChange={(e) => {
                let tagsValue = e.target.value.toLowerCase();

                // no spaces in the front and no multiple spaces between words 

                tagsValue = tagsValue.replace(/\s+/g, ' ');

                this.setState({ tagsValue: tagsValue })
              }}
              style={{ width: 430, marginLeft: 15, minHeight: 40 }}
              className={" bg-zinc-800 outline-0 mt-2 border-r-rounded-lg pl-4 border border-zinc-700"}
              placeholder={"Add comma separated tags + Enter"}>
            </input>


          </>
        }


        {
          this.state.showChat &&

          <div onMouseLeave={() => {
            this.setState({ displayChatHistory: false })
          }}>
            <div
              style={{ marginLeft: 18 }}
              className={"flex flex-row"}>
              <input

                onKeyDown={(e) => {
                  if (e.key == "Enter") {
                    this.processChat();
                  }
                }}
                value={this.state.chatQuestion}
                onChange={(e) => {
                  this.setState({ chatQuestion: e.target.value })
                }}
                style={{ width: 390, marginleft: 30, height: 40 }}
                className={" bg-zinc-800 outline-0  border-r-rounded-lg pl-4 border border-zinc-700"}
                placeholder={"Ex: Translate following to spanish + Enter"}>
              </input>
              <div
                onMouseEnter={() => {
                  this.setState({ displayChatHistory: true })
                }}
                className={"cursor-pointer bg-zinc-800 border-zinc-700 border-r-2 border-t-2 border-b-2 items-center justify-center flex flex-row"}
                style={{ width: 35, height: 40, borderTopRightRadius: 8, borderBottomRightRadius: 8 }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </div>


            </div>

            {
              this.state.displayChatHistory &&
              <div

                className={"bg-zinc-800 border-2 border-zinc-700 rounded-lg"}
                style={{ position: "absolute", width: 430, marginLeft: 15, height: 150, marginBottom: 200 }}>
                <div className={"text-gray-400 ml-4 mt-2"}>Chat History</div>

                <div style={{ height: 115, width: 430, marginLeft: 15, marginTop: 2, overflow: "scroll" }}>
                  {
                    this.state.chatHistory.map((chat) => {
                      return (
                        <div
                          onClick={() => {
                            this.setState({ chatQuestion: chat, displayChatHistory: false }, () => {
                              this.processChat();
                            })
                          }}
                          className={"h-[35px] cursor-pointer hover:bg-zinc-700 text-gray-200 flex flex-row items-center w-[548px]"}>
                          <div className={"pl-3"}>
                            {chat}
                          </div>
                        </div>
                      )
                    })
                  }

                </div>

              </div>

            }


          </div>
        }

        <EditNote
          updateText={(text) => {
            this.setState({ transcribedText: text })
          }
          }
          removeTag={(tag) => this.removeTag(tag)}
          tags={this.state.tags}
          setTitle={(title) => {
            this.setState({ notesTitle: title })
          }}

          text={this.state.transcribedText} title={this.state.notesTitle}></EditNote>

        <div className={"flex flex-row justify-center"}>
          <div
            style={{ height: 30, width: 430, marginLeft: 15 }}
            className={" mt-5 flex flex-row items-center"}>
            <div
              onClick={() => {
                this.setState({ showOriginal: !this.state.showOriginal })
              }}
              className={"bg-orange-600 rounded-lg cursor-pointer p-1  w-[130px] text-center text-sm"}>
              Show original text
            </div>

            <div

              style={{ marginLeft: "auto", display: !this.state.showOriginal ? "none" : "flex" }}
              className={"flex flex-row"}>


              <Copy
                buttonClassName={"hover:bg-zinc-800 rounded-lg p-3"}
                className={"cursor-pointer"}

                text={this.state.originalText}
                style={{ height: 20, width: 20 }}></Copy>

              <div>



                <div style={{ marginLeft: "auto", flex: 1 }} className={"group relative w-max"}>

                  <button
                    onClick={() => {
                      this.setState({ transcribedText: this.state.originalText, showOriginal: false })
                    }}
                    style={{}} className={"hover:bg-zinc-800 rounded-lg p-3"}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
                    </svg>

                  </button>
                  <div class="text-white text-sm rounded-lg flex flex-row items-center justify-center pl-2 pr-2 h-[20px] bg-blue-500 pointer-events-none absolute -top-7 right-0 w-max opacity-0 transition-opacity group-hover:opacity-100">
                    {
                      "Switch to original"
                    }
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>


        {
          this.state.showOriginal &&
          <div
            style={{ minHeight: 100, width: 430, marginLeft: 15 }}
            className={"pt-3 pl-3 bg-zinc-800 rounded-lg mt-2 border border-zinc-700 mt-4"}>
            {
              this.state.originalText
            }
          </div>
        }

        <div style={{ minHeight: 40, minWidth: 460 }}></div>

        
        

      </div>
    )
   }
}

class RecordView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      key: new Date(),
      permissions: null,
      title: "Record"
    }

    this.restart = this.restart.bind(this);

  }

  componentDidMount() {

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { type: "getPermissions" }, function (response) {
       });
    });

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (this.state.permissions != null) {
        return;
      }


      if (message.data == "permissionsgranted") {
        
        this.setState({ permissions: true, key: new Date() });
      } else if (message.data == "permissionsdenied") {
        this.setState({ permissions: false, key: new Date()})
      }
    });
  }

  restart() {
    this.setState({ key: new Date() })

  }

  render() {
    return (
      <div className={"flex bg-zinc-900 text-white h-[420px] w-[460px] items-center flex flex-col"}>
        <div className={"text-lg font-bold text-white mt-5"}>{
          this.state.title
        }</div>

        {
          this.state.permissions == null &&
          <div className={"mt-12"}>Checking Permissions ...</div>
        }
        
        {
          this.state.permissions == false &&
          <div className={"mt-12"}>Please enable microphone permissions</div>
        }

        {
          this.state.permissions == true &&
          <AudioRecorder
              setRecordedNote={this.props.setRecordedNote}
              minutes_used={this.props.minutes_used}
              updateMinutesUsed={this.props.updateMinutesUsed}
              openaiKey={this.props.openaiKey}
              cleanup_enabled={this.props.cleanup_enabled}
              cleanup_prompt={this.props.cleanup_prompt}
              setTitle={(title) => {
                this.setState({ title: title })
              }
              }
              startDate={this.state.key}
              trash={() => {
                this.setState({ key: new Date(), permissions: null })

                this.props.changeView("notes");
              }}
              changeKey={() => {
                this.setState({ key: new Date() })
              }}
            
              
              key={this.state.key/1}></AudioRecorder>
        }
        </div>
 
    )
  }


}


function removeQuotesFromString(text) {
  // remove quotes from the beginning and ending

  if (text[0] == "\"") {
    text = text.substring(1, text.length);
  }

  if (text[text.length - 1] == "\"") {
    text = text.substring(0, text.length - 1);
  }
  return text;
}


class AudioRecorder extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      startDate: null,
      timeElapsed: 0,
      processing: false,
      progress: 0,
      originalText: "",
      transcribedText: "",
      notesTitle: "",
      audioBlob: null,
      audioURL: null,
    }

    this.processor = this.processor.bind(this);
    this.generateTitle = this.generateTitle.bind(this);
    this.transcribe = this.transcribe.bind(this);
    this.promptProcessing = this.promptProcessing.bind(this);
  }

  generateTitle(text) {

    if (text.trim() == "") {
      text = "Untitled Note"

      this.setState({ notesTitle: text, progress: 3 })

      setTimeout(() => {
        this.props.setRecordedNote({
          transcribed_text: this.state.transcribedText,
          original_text: this.state.originalText,
          title: this.state.notesTitle,
          aurioURL: this.state.audioURL,
        })

      }, 500)

      return;
    }

    let messages = [{ role: "user", content: "generate a short title for text to be saved in a notes app. keep it at 3 words or less. only one answer." + " " + text }]

    let data = {
      "model": "gpt-3.5-turbo",
      "messages": messages,
    }


    fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + this.props.openaiKey,
      },
      body: JSON.stringify(data),
    }).then(resp => {
      return resp.json();
    }).then(resp => {


      this.setState({ notesTitle: removeQuotesFromString(resp.choices[0].message.content), processingChat: 0, progress: 3 });

      setTimeout(() => {
        this.props.setRecordedNote({
          transcribed_text: this.state.transcribedText,
          original_text: this.state.originalText,
          title: this.state.notesTitle,
          audioURL: this.state.audioURL,
        })

      }, 500);


    }).catch(e => {
      alert("error")
    })
  }

  promptProcessing(text) {
    if (text == undefined) {
      text = "";
    }

    if (text.trim() == "") {

      this.setState({ transcribedText: "", progress: 2 }, () => {
        this.generateTitle(this.state.transcribedText)
      });

      return;
    }

    if (this.props.cleanup_enabled == false) {
      this.setState({
        transcribedText: text,
        progress: 2
      }, () => {
        this.generateTitle(this.state.transcribedText);
      })
      return;
    }

    let messages = [{ role: "user", content: this.props.cleanup_prompt + text }]

    let data = {
      "model": "gpt-3.5-turbo",
      "messages": messages,
    }


    fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + this.props.openaiKey,
      },
      body: JSON.stringify(data),
    }).then(resp => {
      return resp.json();
    }).then(resp => {

      this.setState({ transcribedText: resp.choices[0].message.content, progress: 2 }, () => {
        this.generateTitle(this.state.transcribedText)
      });

    }).catch(e => {
      alert("error")
    })
  }

  transcribe(audioBlob) {
    // todo 
    const url = 'https://api.openai.com/v1/audio/transcriptions';
    const apiKey = this.props.openaiKey;

    const formData = new FormData();
    formData.append('model', 'whisper-1');
    let file = new File([audioBlob], 'openai.mp4', { type: 'audio/mpeg' });

    formData.append("file", file);

    fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    })
      .then(response => response.json())
      .then(data => {
        this.setState({ originalText: data.text, progress: 1 }, () => {
          this.promptProcessing(data.text);
        });

      }
      )
      .catch(e => {
        if (JSON.stringify(e) == "{}") {
          alert("error");
        } else {
          alert(JSON.stringify(e))
        }
      });
  }


  processor() {

  }

  componentDidMount() {
   

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { type: "startaudio" }, (response) => {


   
        let startDate = new Date();
        this.setState({ startDate }, () => {

          let interval = setInterval(() => {
            this.setState({ timeElapsed: Math.round((new Date() - this.state.startDate) / 1000) });
          }, 1000);
        })


      });
    });

    

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type == "audio") {
    
        this.setState({ processing: true }, () => {
          this.props.setTitle("Processing Audio");
        })

        fetch(API_URL + "/updateMinutesUsed",
          {
            method: "POST",
            credentials: "include",
            body: JSON.stringify({ minutes_used: this.props.minutes_used + Math.round((new Date() - this.state.startDate) / 1000) })
      }).then(resp => resp.json()).then(resp => {
        
      }).catch(err => {
        
       
      })

        this.props.updateMinutesUsed(this.props.minutes_used + Math.round((new Date() - this.state.startDate) / 1000));
      

        this.setState({ timeElapsed: 0 });
        let audioUrl = message.audioUrl;

        this.setState({audioURL: audioUrl})

        let audio = new Audio(audioUrl);
         const audioBlobPromise = fetch(audioUrl)
          .then(response => response.blob())
          .then(blob => {
            this.setState({ audioBlob: blob }, () => {
              this.transcribe(blob);
            });
          })
          .catch(error => {
            console.error("Error fetching audioBlob:", error);
          });
      }
    });
    


    
  }


  render() {
    const progress = {
      0: "Processing Audio to Text",
      1: "Postprocessing Text",
      2: "Creating Metadata",
      3: "Processing Completed"
    }

    if (this.state.processing) {
      return (
        <div style={{ marginTop: 80 }}>
          <div
            className={"text-center"}
            style={{ marginTop: 20, marginBottom: 30, width: "100%" }}>Do not close the extension!</div>

          <div
            style={{ width: 350 }}
            className={"flex flex-row items-center justify-center"}>

            <div

              style={{

                borderTopLeftRadius: 8,
                borderBottomLeftRadius: 8,
                borderTopRightRadius: this.state.progress == 3 ? 8 : 0,
                borderBottomRightRadius: this.state.progress == 3 ? 8 : 0,
                height: 15, width: this.state.progress / 3 * 300
              }}
              className={"bg-green-500"}>

            </div>

            <div
              style={{
                borderTopRightRadius: 8,
                borderBottomRightRadius: 8,
                borderTopLeftRadius: this.state.progress == 0 ? 8 : 0,
                borderBottomLeftRadius: this.state.progress == 0 ? 8 : 0,
                height: 15, width: 300 - this.state.progress / 3 * 300
              }}
              className={"bg-zinc-600"}>

            </div>
          </div>

          <div className={"flex flex-row text-gray-300 items-center justify-center w-[350px] mt-3 text-sm"}>
            {
              this.state.progress + "/3 " + progress[this.state.progress]
            }
          </div>

        </div>
      )
    
      
    }

    return (

      <div className={"flex flex-col mt-10 items-center justify-center"}>
        <div className={"text-gray-300"}>Do not close the extension!</div>

        <div
          style={{ width: 350, height: 130, borderRadius: 20, marginTop: 5 }}
          className={"bg-blue-500 flex flex-col"}>

          <div style={{ width: 300, height: 30 }}
          ><div style={{ marginTop: 10, marginLeft: 35, fontSize: 14 }}>
          
            </div></div>


          <div
            style={{}}
            className={"flex flex-row  justify-center mt-4 text-xl"}>

            {
              displaySeconds(this.state.timeElapsed)
            }

          </div>




        </div>
        <AudioControls
          minutes_used={this.props.minutes_used}
          updateMinutesUsed={this.props.updateMinutesUsed}
          restart={() => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
              chrome.tabs.sendMessage(tabs[0].id, { type: "restartaudio" }, (response) => {
                this.props.changeKey();
              });
            }) 
          }}
          endAudio={() => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
              chrome.tabs.sendMessage(tabs[0].id, { type: "stopaudio" }, (response) => {
                // do something 
              });
            })
          }}
          
          
          trash={() => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
              chrome.tabs.sendMessage(tabs[0].id, { type: "trashaudio" }, (response) => {
                this.props.trash();
              });
            })
          }}></AudioControls>

      </div>

    )
  }
}



function displaySeconds(seconds) {
  let minutes = Math.floor(seconds / 60);
  let secondsLeft = seconds % 60;

  if (minutes < 10) {
    minutes = "0" + minutes;
  }

  if (secondsLeft < 10) {
    secondsLeft = "0" + secondsLeft;
  }

  return minutes + ":" + secondsLeft;
}


class AudioControls extends React.Component {

  constructor(props) {
    super(props);
    this.state = {

    }
  }

  render() {
    return (
      <div>
        <div
          className={"bg-zinc-700 rounded-lg flex"}
          style={{ width: 300, height: 60, marginTop: 30 }}>

          <div
            className={"flex flex-row items-center justify-center"}
            style={{ flex: 2 }}>

            <svg
              onClick={() => {
                this.props.restart();
              }}
              className={"cursor-pointer"}
              xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 17, height: 17 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </div>


          <div
            className={"flex flex-row items-center justify-center"}
            style={{ flex: 6 }}>
            <svg
              onClick={() => {

                this.props.endAudio();



              }}
              className={"cursor-pointer"}
              xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ height: 40, width: 40 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" />
            </svg>

          </div>

          <div

            className={"flex flex-row items-center justify-center"}

            style={{ flex: 2 }}>

            <svg
              onClick={() => {
                this.props.trash();
              }}
              className={"cursor-pointer"}
              xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 17, height: 17 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </div>

        </div>

      </div>
    )
  }
}

class NotesView extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      
    }
  
  }

  componentDidMount() {

   }

  render() {
   
  

     return (
      <div className={"flex bg-zinc-900 text-white h-[420px] w-[460px] flex flex-col"}>
        <div className={"flex flex-row justify-center mt-3 h-[40px]"}>
           <input
             onKeyDown={(e) => {
               
               if (e.key == "Enter") {
                 this.props.search();
             
               }
             }}
             value={this.props.searchTerm}
              onChange={(e) => {
                this.props.updateSearchTerm(e.target.value);
              }}
            placeholder='Search Notes'
             className={"text-md pl-3 bg-zinc-800 h-[40px] w-[390px] rounded-lg  ml-2 border border-zinc-700"}>
            </input>

          <div
             onClick={() => {
             
               if (this.props.current_plan == "free" && this.props.minutes_used / 300 > 1) {
                  alert("You have used all your free minutes. Please upgrade to continue using the app.")
                  return;  
               }

              this.props.changeView("record")
            }}
            
            className={"bg-zinc-800 rounded-lg p-2 ml-2 border border-zinc-800 cursor-pointer"}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="red" viewBox="0 0 24 24" strokeWidth={1.5} stroke="red" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
            </svg>
          </div>


         </div>
         
         <div className={"flex flex-row flex-wrap gap-x-2 gap-y-2 mt-3 ml-4"}>
         {
           this.props.tags != null && this.props.tags.map((tag) => {
             return (
               <div
                 
                 onClick={() => {
                   this.props.selectTag(tag);
                 }}
                 style={{ fontSize: 12 }}
                 className={`${this.props.selectedTags.includes(tag) ? 'bg-blue-600' : 'bg-zinc-700'} pl-2 pr-2 pt-1 pb-1 cursor-pointer rounded-lg`}>{tag}</div>
             )
           })
           }

           
           {
             this.props.selectedTags.length > 0 && 
             <div className={"flex flex-row items-center justify-center"}>
             <div
                 onClick={() => {
                   this.props.clearTags();
                 
                 }}
                style={{height: 25, width: 25, borderRadius: 23}}
                   className={"bg-zinc-700 flex flex-row items-center justify-center cursor-pointer font-bold"}><div>x</div></div>
                 
                 {
                   this.props.searched == false &&
                   <div
                     onClick={() => {
                       this.props.search();
                     }}
                     className={"cursor-pointer bg-green-500 rounded-lg pl-2 pr-2 pt-1 pb-1 ml-2"}>search</div>
                 }
                 </div>
             
           }
         </div>
         
         {
           this.props.current_plan == "free" &&
           <div
             className={"flex flex-row items-center justify-center mt-2"}
           >
             <div
               style={{ height: 100, width: 270 }}
               className={"bg-zinc-800 rounded-xl text-sm flex flex-col items-center justify-center"}>
               <div>{(this.props.minutes_used / 300 * 5).toFixed(2)}/5 Free Minutes Used</div>
               <div className={"flex flex-row"}>
                 <div
                   className={"bg-green-500"}
                   style={{ marginTop: 10, width: Math.min(this.props.minutes_used / 300 * 220, 220), height: 20 }}>

                 </div>

                 <div
                   className={"bg-gray-700"}
                   style={{ marginTop: 10, width: 220 - Math.min(this.props.minutes_used / 300 * 220, 220), height: 20 }}>

                 </div>

               </div>

               <button
                   onClick={() => {
                     
                   chrome.tabs.update(undefined, { url: "https://www.whispernotes.xyz/app" });
                 }}
                 className={"bg-blue-500 rounded-lg h-[25px] w-[80px] text-md mt-3"}>Upgrade</button>



             </div>

           </div>

         }
         
         {
           (this.props.tags == null || this.props.notes == null) && 
           <div className={"text-white font-bold mt-10 flex flex-row items-center justify-center"}>
               Loading Notes...
           </div>
         }

         {
           (this.props.searching) &&
           <div className={"text-white font-bold mt-10 flex flex-row items-center justify-center"}>
             Searching Notes...
           </div>
         }

         <div
      
           className={"flex flex-col mt-3 gap-y-2 overflow-scroll"}>
           {
             (this.props.notes != null && this.props.tags != null && this.props.searching == false) && this.props.notes.map((note) => {
               return (
                 <NoteDisplay
                   onClick={() => {
                     this.props.changeView("edit");
                     this.props.setEditNote(note);
                   }}
                   note={note}></NoteDisplay>
              ) 
             })
           }

       

           <div style={{minHeight: 50}}></div>
           
         </div>

         <div
           onClick={() => {
             let url = "https://www.whispernotes.xyz/app";
             chrome.tabs.update(undefined, { url: url });
           }}
          className={" bg-zinc-800 border border-zinc-600 cursor-pointer flex flex-row items-center justify-center"}
           style={{ position: "absolute", bottom: 10, left: 14, width: 35, height: 35, borderRadius: 20 }}>
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.3} stroke="white" className="w-5 h-5 ">
             <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
           </svg>

         </div>
    


      </div>
    )
  }
}

class NoteDisplay extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      displayOptions: false
    }
  }

  render() {
    let note = this.props.note;
    return (
      <div
        onClick={() => {
          this.props.onClick();
        }}
        onMouseEnter={() => {
          this.setState({ displayOptions: true })
        }}
        onMouseLeave={() => {
          this.setState({ displayOptions: false })
        }}
        style={{ width: "93%", marginLeft: "3.5%", minHeight: 130 }}
        className={"bg-zinc-800 rounded-lg cursor-pointer"}>

        <div style={{height: 100}}>
        <div className={"text-md font-bold mt-2 ml-2 text-gray-300"}>
          {
            note.title
          }

        </div>

        <div className={"flex flex-row mt-1 ml-2 gap-x-2"}>
          {
            note.tagsJson.map(tag => {
              return (
                <div

                  style={{ fontSize: 12 }}
                  className={" bg-zinc-700 pl-1 pr-1 pt-1 pb-1 cursor-pointer rounded-lg"}>{tag}</div>
              )
            })
          }



        </div>

        <div style={{ width: "94%", marginLeft: "3%", marginTop: 10 }}>
          {
            note.tagsJson.length == 0 ? note.note.length > 220 ? note.note.substring(0, 220) + "..." : note.note : note.note.length > 180 ? note.note.substring(0, 100) + "..." : note.note
          }
          </div>
          </div>

        <div
          style={{ width: "100%", height: 20, marginTop: "auto" }}
          className={""}>
          {
            this.state.displayOptions &&

            <div
              style={{ marginLeft: 350, width: 100, marginBottom: 4 }}
              className={"flex flex-row items-center justify-end right-0"}>





              <div
                style={{ marginRight: 10, }}
                className={"group relative w-max"}>

                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 cursor-pointer">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>

                <div class="text-white text-sm rounded-lg flex flex-row items-center justify-center pl-2 pr-2 h-[20px] bg-blue-500 pointer-events-none absolute -top-7 right-0 w-max opacity-0 transition-opacity group-hover:opacity-100">
                  {
                    "Edit"
                  }
                </div>

              </div>


              <div
                onClick={async (e) => {
                  e.stopPropagation();

                  // download note.url 

                  try {
                    const response = await fetch(note.url);
                    const blob = await response.blob();

                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = note.title + ".mp3"; // Specify the desired file name for download
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                  } catch (error) {
                    console.error('Error downloading audio:', error);
                  }


                }}
                style={{ marginRight: 10 }}
                className={"group relative w-max"}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 cursor-pointer">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>

                <div class="text-white text-sm rounded-lg flex flex-row items-center justify-center pl-2 pr-2 h-[20px] bg-blue-500 pointer-events-none absolute -top-7 right-0 w-max opacity-0 transition-opacity group-hover:opacity-100">
                  {
                    "Download"
                  }
                </div>

              </div>


              <Copy
                buttonClassName={"p-0"}
                className={"cursor-pointer w-4 h-4 mr-0 mt-1"}
                text={note.note}
                style={{}}></Copy>


            </div>
          }

        </div>

      </div>
    )
  }
}

class Copy extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      copied: false
    }
  }

  render() {
    return (
      <div

        style={{ marginLeft: "auto", flex: 1 }} className={"group relative w-max "}>

        <button
          onClick={(e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(this.props.text).then(() => {
              this.setState({ copied: true }, () => {
                setTimeout(() => {
                  this.setState({ copied: false });
                }, 1000)
              })
              // copied
            }
            )
          }}
          className={this.props.buttonClassName}>
          {

            this.state.copied == false ?
              <svg
                onClick={() => {
                  // copy this.state.answer into the clipboard 


                }}
                className={this.props.className}
                style={this.props.style}
                xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
              </svg>
              :
              <svg
                style={this.props.style}
                xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={this.props.className}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>


          }
        </button>




        <div class="text-white text-sm rounded-lg flex flex-row items-center justify-center pl-2 pr-2 h-[20px] bg-blue-500 pointer-events-none absolute -top-7 right-5 w-max opacity-0 transition-opacity group-hover:opacity-100">
          {
            this.state.copied ? "Copied" : "Copy"
          }
        </div>
      </div>
    )
  }
}


class RegistrationSnippet extends React.Component {

  render() {
    return (
      <div
        className={"flex bg-zinc-900 text-white items-center flex flex-col  border-zinc-800 rounded-lg border-2"}
        style={{ width: 350, height: 300 }}>
        <h1 className={"text-xl font-bold mt-5"}>WhisperNotes</h1>

        <button


          onClick={() => {

            chrome.tabs.update({ url: "https://whispernotes.xyz", active: true })

          }}
          className={"bg-blue-500 rounded-lg p-2 mt-10 text-lg"}>Create an Account</button>
        <p
          className={"text-md"}
          style={{ width: "80%", marginTop: 20 }}>Create an account on whispernotes.xyz and start using the extension!</p>
      </div>
    )
  }
}

class EditView extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      transcribedText: this.props.note.note,
      notesTitle: this.props.note.title,
      tags: this.props.note.tagsJson,
      showOriginal: false,
      originalText: this.props.note.original_note,
      tagsValue: "",
      allTags: this.props.note.allTags,
      saving: false,
      showChat: false, 
      showTag: false,
      allTags: this.props.allTags,
      chatHistory: [],
      chatQuestion: "",
      displayChatHistory: false,
      newTags: [],
      subView: null,
    }

    this.addTag = this.addTag.bind(this);
    this.deleteNote = this.deleteNote.bind(this);
    this.saveNote = this.saveNote.bind(this);
    this.processChat = this.processChat.bind(this);
    this.removeTag = this.removeTag.bind(this);
  }

  removeTag(tag) {

    let tags = this.state.tags;


    tags = tags.filter((t) => {
      return t != tag;
    })

    let newTags = this.state.newTags;
    let allTags = this.state.allTags;

    if (newTags.includes(tag)) {
      newTags = newTags.filter((t) => {
        return t != tag;
      });

      allTags = allTags.filter((t) => {
        return t != tag;
      })

      this.setState({ allTags: allTags, newTags: newTags });


    }

    this.setState({ tags: tags });
  }

  componentDidMount() {

  }

  addTag() {
    if (this.state.tagsValue.trim() == "") {
      this.setState({ tagsValue: "" });
      return;
    }

    let newTags = this.state.tagsValue.split(",").map(tag => tag.trim()).filter((tag) => { return tag.trim() != "" });

    let tags = this.state.tags;

    for (let i = 0; i < newTags.length; i++) {
      if (tags.includes(newTags[i]) == false) {
        tags.push(newTags[i].trim());
      }
    }
    this.setState({ tagsValue: "", tags: tags });

    let allTags = this.state.allTags;

    let brandNewTags = this.state.newTags;
    for (let i = 0; i < newTags.length; i++) {
      if (allTags.includes(newTags[i]) == false) {
        allTags.push(newTags[i].trim());
        brandNewTags.push(newTags[i].trim());
      }
    }

    this.setState({ allTags: allTags, newTags: brandNewTags });
  }

  deleteNote() {

  }

  saveNote() {
    if (this.state.transcribedText == null || this.state.transcribedText.trim() == "") {
      alert("Please enter a note.")
      return;
    }

    if (this.state.notesTitle == null || this.state.notesTitle.trim() == "") {

      alert("Please enter a title.")
      return;
    }

    this.setState({ saving: true })

    fetch(API_URL + "/editNote", {
      method: "POST",
      credentials: "include",
      body: JSON.stringify(
        {
          noteId: this.props.note.id,
          text: this.state.transcribedText,
          tags: this.state.tags,
          title: this.state.notesTitle,
          allTags: this.state.allTags,
          original_text: this.state.originalText,
        })
    }
      
      
      ).then(resp => resp.json()).then((response) => {

      this.props.setNotes({

        id: this.props.note.id,
        note: this.state.transcribedText,
        tagsJson: this.state.tags,
        title: this.state.notesTitle,
        original_note: this.state.originalText,
      });

      this.setState({ saving: false });
      this.props.setTags(this.state.allTags);
      this.props.setView("notes")

    }).catch((error) => {
      this.setState({ saving: false })
      alert("Error saving note. Please try again.")
    })

  }


  processChat() {
    if (this.state.chatQuestion.trim() == "") {
      return;
    }
    this.setState({ processingChat: 1, displayChatHistory: false })

    let chatHistory = this.state.chatHistory;
    if (chatHistory.includes(this.state.chatQuestion) == false) {
      chatHistory.push(this.state.chatQuestion);
    }


    this.setState({ chatHistory });

    fetch("/api/updateChatQuestions", {
      method: "POST",
      credentials: "include",
      body: JSON.stringify(
      {
      chatQuestions: chatHistory,
    })
  }).then(resp => {

  }).catch(err => {
    })


    let messages = [{ role: "user", content: this.state.chatQuestion + " \n " + this.state.transcribedText }]

    let data = {
      "model": "gpt-3.5-turbo",
      "messages": messages,
    }


    fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + this.props.openaiKey,
      },
      body: JSON.stringify(data),
    }).then(resp => {
      return resp.json();
    }).then(resp => {


      this.setState({ transcribedText: resp.choices[0].message.content, processingChat: 0 });



    }).catch(e => {
      alert("error")
    })


  }

  render() {
    if (this.state.subView != null) {
      return (<div className={"flex bg-zinc-900 text-white h-[420px] w-[460px] flex flex-col overflow-scroll"}>
        <div className={"text-lg flex flex-row items-center justify-center font-bold mt-12 text-md"}><div>Are you sure you want to delete this note?</div></div>

        <div className={"flex flex-row items-center justify-center mt-5"}> 

          <button
            onClick={() => {
              this.setState({ subView: null });
            }}
            className={'bg-zinc-700 w-[100px] h-[40px] rounded-lg'}>No</button>
          <button
            onClick={() => {
              this.props.deleteNote();
            }}
            
            className={'bg-red-500 w-[100px] h-[40px] rounded-lg ml-2'}>Delete</button>

        </div>
      </div>
      )
      
    }
    if (this.state.saving == true) {
      return (
       
        <div className={"flex bg-zinc-900 text-white h-[420px] w-[460px] flex flex-col overflow-scroll"}>
          <div className={"text-lg flex flex-row items-center justify-center font-bold mt-12 text-md"}><div>Saving Note ...</div></div>

        </div>
       )
    }
    return (
      <div className={"flex bg-zinc-900 text-white h-[420px] w-[460px] flex flex-col overflow-scroll"}>
          <div className={"text-lg flex flex-row items-center justify-center font-bold mt-4"}><div>Edit Note</div></div>
    
        <div className={"mt-2 flex flex-row items-center justify-center"}>
          <AudioPlayer src={this.props.note.url}></AudioPlayer>
        </div>
        
        <div style={{ marginTop: 30, width: 430, marginLeft: 15}} className={"flex flex-row"}>


          <div
            onClick={() => {
              this.props.setView("notes")
            }}
            className={'cursor-pointer bg-zinc-800 border border-zinc-700 rounded-lg text-white pl-2 pr-2 w-[190] items-center flex flex-row h-[50px]'}>Back</div>

          <div
            className={"flex flex-row items-center justify-center"}
            style={{ marginLeft: "auto", marginRight: 5, marginBottom: 11 }}>






            <div className={"group relative w-max"}>


              <button
                onClick={() => {
                  this.saveNote();
                }}
                style={{}} className={"hover:bg-zinc-800 rounded-lg p-3"}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 24, height: 24 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
              </button>

              <div class="text-white text-sm rounded-lg flex flex-row items-center justify-center pl-2 pr-2 h-[20px] bg-blue-500 pointer-events-none absolute -top-7 left-0 w-max opacity-0 transition-opacity group-hover:opacity-100">
                {
                  "Save"
                }
              </div>

              <div>

              </div>

            </div>



            <div className={"group relative w-max"}>

              <button
                className={"hover:bg-zinc-800 rounded-lg p-3"}
                onClick={() => {
                  this.setState({ showTag: !this.state.showTag, showChat: false })
                }}>

                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                </svg>
              </button>

              <div
                class="text-white text-sm rounded-lg flex flex-row items-center justify-center pl-2 pr-2 h-[20px] bg-blue-500 pointer-events-none absolute -top-7 left-0 w-max opacity-0 transition-opacity group-hover:opacity-100">
                {
                  "Add Tag"
                }
              </div>

              <div>

              </div>

            </div>




      



            <Copy
              buttonClassName={"hover:bg-zinc-800 rounded-lg p-3"}
              className={"cursor-pointer w-5 h-5"}

              text={this.state.transcribedText}
              style={{}}></Copy>



            <div className={"group relative w-max"}>


              <button
                onClick={async () => {
                  // download the audio blob 


                  try {
                    const response = await fetch(this.props.note.url);
                    const blob = await response.blob();

                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = this.props.note.title + ".mp3"; // Specify the desired file name for download
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                  } catch (error) {
                    console.error('Error downloading audio:', error);
                  }



                }}
                style={{}} className={"hover:bg-zinc-800 rounded-lg p-3 "}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={"w-5 h-5"} >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15M9 12l3 3m0 0l3-3m-3 3V2.25" />
                </svg>

              </button>

              <div class="text-white text-sm rounded-lg flex flex-row items-center justify-center pl-2 pr-2 h-[20px] bg-blue-500 pointer-events-none absolute -top-7 right-0 w-max opacity-0 transition-opacity group-hover:opacity-100">
                {
                  "Download Audio"
                }
              </div>

              <div>

              </div>

            </div>



            <div className={"group relative w-max"}>

              <div
                onClick={() => {
                  this.setState({ subView: "delete" })
                }}
                style={{}} className={"p-3 hover:bg-zinc-800 rounded-lg"}>
                <svg
                  
                  xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={"w-5 h-5 cursor-pointer"}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </div>

              <div class="text-white text-sm rounded-lg flex flex-row items-center justify-center pl-2 pr-2 h-[20px] bg-blue-500 pointer-events-none absolute -top-7 left-0 w-max opacity-0 transition-opacity group-hover:opacity-100">
                {
                  "Delete"
                }
              </div>

              <div>

              </div>

            </div>





          </div>
        </div>


        {
          this.state.showTag &&
          <>

            <div
              className={"flex flex-row space-between flex-wrap space-x-2 space-y-2"}
              style={{ width: 430, marginLeft: 15 }}>
              <div></div>
              {
                this.state.allTags.map(tag => {
                  return (
                    <div
                      onClick={() => {
                        let tags = this.state.tags;
                        if (tags.includes(tag) == false) {
                          tags.push(tag);
                        }
                        this.setState({ tags: tags });
                      }}
                      className={"cursor-pointer bg-blue-500 text-sm pr-2 pl-2 h-[23px] rounded-lg"}>
                      <div className={""}>
                        {tag}
                      </div>
                    </div>

                  )

                })
              }
            </div>

            <input


              onKeyDown={(e) => {
                if (e.key == "Enter") {
                  this.addTag();
                }
              }}
              value={this.state.tagsValue}
              onChange={(e) => {
                let tagsValue = e.target.value.toLowerCase();

                // no spaces in the front and no multiple spaces between words 

                tagsValue = tagsValue.replace(/\s+/g, ' ');

                this.setState({ tagsValue: tagsValue })
              }}
              style={{ width: 430, marginLeft: 15, minHeight: 40 }}
              className={" bg-zinc-800 outline-0 mt-2 border-r-rounded-lg pl-4 border border-zinc-700"}
              placeholder={"Add comma separated tags + Enter"}>
            </input>


          </>
        }

        
        {
          this.state.showChat &&

          <div onMouseLeave={() => {
            this.setState({ displayChatHistory: false })
          }}>
              <div
                style={{marginLeft: 18}}
                className={"flex flex-row"}>
              <input

                onKeyDown={(e) => {
                  if (e.key == "Enter") {
                    this.processChat();
                  }
                }}
                value={this.state.chatQuestion}
                onChange={(e) => {
                  this.setState({ chatQuestion: e.target.value })
                }}
                style={{ width: 390, marginleft: 30, height: 40 }}
                className={" bg-zinc-800 outline-0  border-r-rounded-lg pl-4 border border-zinc-700"}
                placeholder={"Ex: Translate following to spanish + Enter"}>
              </input>
              <div
                onMouseEnter={() => {
                  this.setState({ displayChatHistory: true })
                }}
                className={"cursor-pointer bg-zinc-800 border-zinc-700 border-r-2 border-t-2 border-b-2 items-center justify-center flex flex-row"}
                style={{ width: 35, height: 40, borderTopRightRadius: 8, borderBottomRightRadius: 8 }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </div>


            </div>

            {
              this.state.displayChatHistory &&
              <div

                className={"bg-zinc-800 border-2 border-zinc-700 rounded-lg"}
                style={{ position: "absolute", width: 430, marginLeft: 15 , height: 150, marginBottom: 200 }}>
                <div className={"text-gray-400 ml-4 mt-2"}>Chat History</div>

                <div style={{ height: 115, width: 430, marginLeft: 15, marginTop: 2, overflow: "scroll" }}>
                  {
                    this.state.chatHistory.map((chat) => {
                      return (
                        <div
                          onClick={() => {
                            this.setState({ chatQuestion: chat, displayChatHistory: false }, () => {
                              this.processChat();
                            })
                          }}
                          className={"h-[35px] cursor-pointer hover:bg-zinc-700 text-gray-200 flex flex-row items-center w-[548px]"}>
                          <div className={"pl-3"}>
                            {chat}
                          </div>
                        </div>
                      )
                    })
                  }

                </div>

              </div>

            }


          </div>
        }


        <EditNote
          updateText={(text) => {
            this.setState({ transcribedText: text })
          }
          }
          removeTag={(tag) => this.removeTag(tag)}
          tags={this.state.tags}
          setTitle={(title) => {
            this.setState({ notesTitle: title })
          }}

          text={this.state.transcribedText} title={this.state.notesTitle}></EditNote>


        <div className={"flex flex-row justify-center"}>
          <div
            style={{ height: 30, width: 430, marginLeft: 15 }}
            className={" mt-5 flex flex-row items-center"}>
            <div
              onClick={() => {
                this.setState({ showOriginal: !this.state.showOriginal })
              }}
              className={"bg-orange-600 rounded-lg cursor-pointer p-1  w-[130px] text-center text-sm"}>
              Show original text
            </div>

            <div

              style={{ marginLeft: "auto", display: !this.state.showOriginal ? "none" : "flex" }}
              className={"flex flex-row"}>


              <Copy
                buttonClassName={"hover:bg-zinc-800 rounded-lg p-3"}
                className={"cursor-pointer"}

                text={this.props.note.original_note}
                style={{ height: 20, width: 20 }}></Copy>

              <div>



                <div style={{ marginLeft: "auto", flex: 1 }} className={"group relative w-max"}>

                  <button
                    onClick={() => {
                      this.setState({ transcribedText: this.state.originalText, showOriginal: false })
                    }}
                    style={{}} className={"hover:bg-zinc-800 rounded-lg p-3"}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
                    </svg>

                  </button>
                  <div class="text-white text-sm rounded-lg flex flex-row items-center justify-center pl-2 pr-2 h-[20px] bg-blue-500 pointer-events-none absolute -top-7 right-0 w-max opacity-0 transition-opacity group-hover:opacity-100">
                    {
                      "Switch to original"
                    }
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>


        {
          this.state.showOriginal &&
          <div
            style={{ minHeight: 100, width: 430, marginLeft: 15 }}
            className={"pt-3 pl-3 bg-zinc-800 rounded-lg mt-2 border border-zinc-700 mt-4"}>
            {
              this.props.note.original_note
            }
          </div>
        }

        <div style={{ minHeight: 40, minWidth: 460 }}></div>

        

      </div>
    )
  }
}


class EditNote extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showTag: false,
      screenWidth: 450,

    }
    this.textRef = React.createRef();

  }

  componentDidMount() {
   

  }



  render() {
    return (
      <div
        style={{ marginLeft: 15,height: Math.max(this.state.textHeight + 150, 300), width: 430 }}
        className={`bg-zinc-800 rounded-lg mt-2 border border-zinc-700`}>

        <div
          style={{ width: this.state.screenWidth > 550 ? 550 : this.state.screenWidth - 20 }}
          className={" flex flex-col items-center justify-center mt-4 "}>
          <div style={{ width: "90%" }}>
            <input
              placeholder={"Notes Title"}
              onChange={(e) => {
                this.props.setTitle(e.target.value);

              }}
              value={

                this.props.title

              }
              className={"text-lg font-bold outline-none bg-zinc-800"} style={{ borderWidth: 0 }}>

            </input>


            <div
              className={"flex flex-row mt-1 flex-wrap space-x-2 space-y-2"}
              style={{ width: "100%" }}>





              <div></div>


              {
                this.props.tags.map((tag) =>
                  <div
                    onClick={() => {
                      this.props.removeTag(tag);
                    }}
                    className={`cursor-pointer bg-blue-500 text-sm pr-2 pl-2 h-[23px] rounded-lg`}>{tag}

                  </div>
                )
              }
            </div>
          </div>

          <textarea
            ref={this.textRef}

            value={this.props.text}
            onChange={e => this.props.updateText(e.target.value)}
            className={"outline-none bg-zinc-800"}
            onInput={() => {
              if (this.textRef.current) {
                this.setState({ textHeight: this.textRef.current.scrollHeight })
              }
            }}
            style={{
              overflow: "hidden",
              width: "90%", minHeight: 50,
              minHeight: 250,
              height: Math.max(this.state.textHeight, 50),
              resize: "none", marginTop: 20, lineHeight: 1.8, fontSize: 16
            }}>


          </textarea>


          <div style={{ height: 20, width: "100%" }}></div>


        </div>

      </div>
    )
  }
}

const AudioPlayer = ({ src }) => {
  const [audio] = useState(new Audio(src));
  const [elapsedTime, setElapsedTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [playing, setPlaying] = useState(false);

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  useEffect(() => {
    const updateElapsedTime = () => {
      setElapsedTime(audio.currentTime);
    };
    const handleCanPlayThrough = () => {
      setTotalDuration(audio.duration);
    };

    audio.addEventListener('timeupdate', updateElapsedTime);

    audio.addEventListener('canplaythrough', handleCanPlayThrough);

  }, [audio]);



  const play = () => {
    setPlaying(true);

    audio.play();
    audio.loop = true;
  };

  const pause = () => {
    setPlaying(false);

    audio.pause();
  };

  return (
    <div>

      <div
        className={"bg-zinc-800 border border-zinc-700 flex flex-row items-center"}
        style={{ height: 50, width: 90, borderRadius: 15 }}>

        {
          playing == false ?
            <svg
              onClick={play}
              style={{ marginLeft: 10 }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 cursor-pointer">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
            </svg>
            :
            <svg
              onClick={pause}
              style={{ marginLeft: 10 }}
              xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 cursor-pointer">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
            </svg>


        }

        <div style={{ marginLeft: 5 }}>
          {

            formatTime(elapsedTime)
          }
        </div>


      </div>
    </div>
  );
};


export default App
