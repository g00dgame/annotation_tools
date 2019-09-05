import React from 'react';

/**
 * This renders a modal for category selection.
 */
export class ChangeCategoryModal extends React.Component {

  constructor(props) {
    super(props);
    // want to add an index to the categories
    var data = [];
    for(var i = 0; i < this.props.categories.length; i++){
      var cat = Object.assign({}, this.props.categories[i]);
      cat.idx = i;
      data.push(cat);
    }

    let annotationIndex = props.annotationIndex;

    this.state = {
      data: data,
      filteredData : data,
      annotationIndex: annotationIndex
    };

    this.filterData = this.filterData.bind(this);
    this.onCancel = this.onCancel.bind(this);
    this.onSelect = this.onSelect.bind(this);
  }

  shown(){
    this.filterInput.focus();
  }

  onCancel(){
    this.props.cancelled();
  }

  onSelect(e){
    let idx = parseInt(e.target.dataset.idx) + 1;
    this.props.selected(idx, this.state.annotationIndex);
  }

  componentDidUpdate(prevProps) {
    if (this.props.annotationIndex !== prevProps.annotationIndex) {
        this.setState({
            annotationIndex: this.props.annotationIndex
        });
    }
  }

  filterData(e){
    e.preventDefault();
    let regex = new RegExp(e.target.value, 'i');
    let filtered = this.state.data.filter((category) => {
      return category.name.search(regex) > -1;
    });

    this.setState({
      filteredData : filtered
    });
  }

  render(){
    let filteredCategories = this.state.filteredData;
    let category = this.props.category;

    var categoryEls = [];
    for(var i = 0; i < filteredCategories.length; i++){
      let cat = filteredCategories[i];
      categoryEls.push((
        <li key={cat.idx}>
          <button data-idx={cat.idx} type="button" className="btn btn-outline-primary" onClick={this.onSelect}>{cat.name}</button>
        </li>
      ));
    }

    return (
      <div>
        <div className="modal-header">
          <h5 className="modal-title" id="categoryChangeModalLabel">Изменить категорию</h5>
        </div>
        <div className="modal-body">
          <input ref={(input) => {this.filterInput = input;}} type='text' value={category.name} onChange={this.filterData}></input>
          <ul id="categoryChangeModalCategoryList">{categoryEls}</ul>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={this.onCancel}>Отмена</button>
        </div>
      </div>
    );
  }
}